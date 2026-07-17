import express from 'express'
import crypto from 'crypto'
import { readDB, writeDB } from './db.js'
import { PLANS } from './plans.js'

/* ============================================================================
 * Monetização via Kiwify.
 *  - GET  /billing/plans     : config pública (checkout, preço, planos/cotas)
 *  - POST /webhooks/kiwify   : webhook da Kiwify (ativa/cancela o Pro)
 *
 * Fluxo: o usuário paga no checkout hospedado da Kiwify usando o MESMO e-mail
 * da conta DevPath. A Kiwify chama nosso webhook; validamos a assinatura
 * (HMAC-SHA1 do corpo bruto com o token, enviada em ?signature=) e ligamos ou
 * desligamos o plano Pro. Se o e-mail ainda não tem conta, o upgrade fica
 * pendente e é aplicado no cadastro (applyPendingUpgrade, usado no auth).
 * ==========================================================================*/

const router = express.Router()

const maskEmail = (e) => String(e).replace(/^(.).*(@.*)$/, '$1***$2')

// Config pública para o modal de upgrade do front.
router.get('/billing/plans', (_req, res) => {
  res.json({
    configured: Boolean(process.env.KIWIFY_CHECKOUT_URL),
    checkoutUrl: process.env.KIWIFY_CHECKOUT_URL || null,
    priceLabel: process.env.KIWIFY_PRICE_LABEL || 'R$ 29/mês',
    plans: PLANS,
  })
})

/* Aplica um upgrade pendente (compra feita antes do cadastro). Muta db/user. */
export function applyPendingUpgrade(db, user) {
  const list = db.pendingUpgrades || []
  const i = list.findIndex((p) => p.email.toLowerCase() === user.email.toLowerCase())
  if (i < 0) return false
  user.plan = 'pro'
  user.billing = list[i].billing
  list.splice(i, 1)
  return true
}

router.post('/webhooks/kiwify', (req, res) => {
  // 1) Valida a assinatura (se o token estiver configurado).
  const token = process.env.KIWIFY_WEBHOOK_TOKEN
  if (token) {
    const expected = crypto.createHmac('sha1', token).update(req.rawBody || '').digest('hex')
    const got = String(req.query.signature || '')
    const valid =
      got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))
    if (!valid) return res.status(401).json({ error: 'Assinatura inválida.' })
  } else {
    console.warn('[kiwify] ⚠️  KIWIFY_WEBHOOK_TOKEN não definido — webhook aceito SEM validação (configure em produção!)')
  }

  // 2) Extrai os campos (tolerante a variações de casing do payload).
  const b = req.body || {}
  const event = String(b.webhook_event_type || b.event || '').toLowerCase()
  const orderStatus = String(b.order_status || '').toLowerCase()
  const email = b.Customer?.email || b.customer?.email || ''
  const productId = String(b.Product?.product_id || b.product?.product_id || '')

  // Filtro opcional por produto (ignora eventos de outros produtos da conta).
  if (process.env.KIWIFY_PRODUCT_ID && productId && productId !== process.env.KIWIFY_PRODUCT_ID) {
    return res.json({ ok: true, action: 'ignored', reason: 'outro produto' })
  }
  if (!email) return res.status(400).json({ error: 'Evento sem e-mail do comprador.' })

  const UPGRADE_EVENTS = ['order_approved', 'subscription_renewed']
  const DOWNGRADE_EVENTS = ['order_refunded', 'chargeback', 'subscription_canceled']
  const isUpgrade = UPGRADE_EVENTS.includes(event) || (!event && orderStatus === 'paid')
  const isDowngrade = DOWNGRADE_EVENTS.includes(event) || ['refunded', 'chargedback'].includes(orderStatus)
  const isLate = event === 'subscription_late' // mantém o acesso, só registra o status

  if (!isUpgrade && !isDowngrade && !isLate) {
    return res.json({ ok: true, action: 'ignored', event })
  }

  const billing = {
    provider: 'kiwify',
    orderId: b.order_id || null,
    subscriptionId: b.subscription_id || b.Subscription?.id || null,
    productId: productId || null,
    status: isDowngrade ? 'canceled' : isLate ? 'late' : 'active',
    updatedAt: new Date().toISOString(),
  }

  // 3) Aplica no usuário (ou deixa pendente para quando ele se cadastrar).
  const db = readDB()
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  let action
  if (user) {
    if (isDowngrade) {
      user.plan = 'free'
      action = 'downgraded'
    } else {
      user.plan = 'pro'
      action = isLate ? 'flagged_late' : 'upgraded'
    }
    user.billing = billing
  } else if (isUpgrade) {
    if (!db.pendingUpgrades) db.pendingUpgrades = []
    const entry = { email, billing, createdAt: new Date().toISOString() }
    const i = db.pendingUpgrades.findIndex((p) => p.email.toLowerCase() === email.toLowerCase())
    if (i >= 0) db.pendingUpgrades[i] = entry
    else db.pendingUpgrades.push(entry)
    action = 'pending'
  } else {
    action = 'ignored'
  }
  writeDB(db)

  console.log(`[kiwify] ${event || orderStatus} -> ${action} (${maskEmail(email)})`)
  res.json({ ok: true, action })
})

export default router
