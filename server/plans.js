import { readDB, writeDB } from './db.js'

/* ============================================================================
 * Planos e cotas (monetização).
 * FREE: cotas mensais + limite de roadmaps salvos. PRO: tetos altos anti-abuso.
 * "premiumAi" cobre as features premium: escopo dinâmico, boilerplate,
 * validador de sprint, pato de borracha, README de portfólio e export GitHub.
 * ==========================================================================*/

export const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    savedRoadmaps: 2,
    monthly: { roadmapGen: 5, premiumAi: 5 },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    savedRoadmaps: null, // ilimitado
    monthly: { roadmapGen: 100, premiumAi: 300 }, // teto anti-abuso
  },
}

export const planOf = (user) => (user?.plan === 'pro' ? 'pro' : 'free')
export const monthKey = () => new Date().toISOString().slice(0, 7)

/* Garante o objeto de uso do mês corrente (zera na virada do mês). Muta o user. */
function ensureUsage(user) {
  const month = monthKey()
  if (!user.usage || user.usage.month !== month) {
    user.usage = { month, roadmapGen: 0, premiumAi: 0 }
  }
  return user.usage
}

/* Verifica se o usuário ainda tem cota para `kind` (NÃO consome). */
export function checkQuota(userId, kind) {
  const db = readDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return { ok: false, used: 0, limit: 0, plan: 'free' }
  const plan = PLANS[planOf(user)]
  const usage = ensureUsage(user)
  writeDB(db) // persiste eventual reset de mês
  const limit = plan.monthly[kind] ?? 0
  return { ok: usage[kind] < limit, used: usage[kind], limit, plan: plan.id }
}

/* Consome 1 unidade de cota — chamar SÓ após o sucesso da operação,
 * para não cobrar crédito de chamadas que falharam. */
export function consumeQuota(userId, kind) {
  const db = readDB()
  const user = db.users.find((u) => u.id === userId)
  if (!user) return
  ensureUsage(user)[kind] += 1
  writeDB(db)
}

/* Middleware: bloqueia com 402 UPGRADE_REQUIRED quando a cota do mês acabou. */
export function quotaGate(kind) {
  return (req, res, next) => {
    const gate = checkQuota(req.userId, kind)
    if (!gate.ok) {
      return res.status(402).json({
        error: `Você usou ${gate.used}/${gate.limit} do seu plano ${
          gate.plan === 'free' ? 'Free' : 'Pro'
        } este mês. Faça upgrade para continuar sem limites.`,
        code: 'UPGRADE_REQUIRED',
        quota: { kind, used: gate.used, limit: gate.limit },
      })
    }
    next()
  }
}

/* Visão de uso para exibição (pura — não muta nem persiste). */
export function usageView(db, user) {
  const plan = PLANS[planOf(user)]
  const month = monthKey()
  const u = user.usage && user.usage.month === month ? user.usage : { roadmapGen: 0, premiumAi: 0 }
  const saved = (db.roadmaps || []).filter((r) => r.userId === user.id).length
  return {
    month,
    roadmapGen: { used: u.roadmapGen || 0, limit: plan.monthly.roadmapGen },
    premiumAi: { used: u.premiumAi || 0, limit: plan.monthly.premiumAi },
    savedRoadmaps: { used: saved, limit: plan.savedRoadmaps },
  }
}
