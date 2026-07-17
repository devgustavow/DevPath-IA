import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { generateRoadmap } from './gemini.js'
import authRouter, { softUserId } from './auth.js'
import communityRouter from './community.js'
import meRouter from './me.js'
import featuresRouter from './features.js'
import githubRouter from './github.js'
import billingRouter from './billing.js'
import { checkQuota, consumeQuota } from './plans.js'
import { seedIfEmpty } from './db.js'

/* ============================================================================
 * Backend do DevPath AI — API mínima em Express.
 *   POST /api/roadmap  -> gera o roadmap com o Gemini
 *   GET  /api/health   -> status do serviço
 * ==========================================================================*/

const app = express()
app.use(cors())
// Captura o corpo bruto (req.rawBody) — necessário p/ validar a assinatura
// HMAC do webhook da Kiwify.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8')
    },
  }),
)

const PORT = process.env.PORT || 3001

// Garante usuário/posts de boas-vindas na primeira execução.
seedIfEmpty()

// Rotas de autenticação, comunidade (fórum) e perfil (streak/notificações).
app.use('/api/auth', authRouter)
app.use('/api', communityRouter)
app.use('/api', meRouter)
app.use('/api', featuresRouter) // suggest-features, boilerplate, review-code, rubber-duck, portfolio-readme
app.use('/api', githubRouter) // export/github-issues
app.use('/api', billingRouter) // billing/plans + webhooks/kiwify

// Healthcheck (útil para o front saber se o backend/chave estão de pé).
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  })
})

// Geração do roadmap a partir dos dados do formulário do dev.
app.post('/api/roadmap', async (req, res) => {
  const { project, level, hours, stack, features } = req.body || {}

  if (!project || !String(project).trim()) {
    return res.status(400).json({ error: 'Informe o projeto que deseja construir.' })
  }

  // Cota mensal de gerações para usuários logados (anônimos não são rastreados).
  const userId = softUserId(req)
  if (userId) {
    const gate = checkQuota(userId, 'roadmapGen')
    if (!gate.ok) {
      return res.status(402).json({
        error: `Você usou suas ${gate.limit} gerações de roadmap do mês no plano ${
          gate.plan === 'free' ? 'Free' : 'Pro'
        }. Faça upgrade para continuar.`,
        code: 'UPGRADE_REQUIRED',
        quota: { kind: 'roadmapGen', used: gate.used, limit: gate.limit },
      })
    }
  }

  try {
    const data = await generateRoadmap({
      project: String(project).trim(),
      level: level || 'pleno',
      hours: Number(hours) || 10,
      stack: stack || [],
      features: Array.isArray(features) ? features : [],
    })
    if (userId) consumeQuota(userId, 'roadmapGen') // só cobra a cota em caso de sucesso
    res.json({ source: 'ai', ...data })
  } catch (err) {
    console.error('[POST /api/roadmap] erro:', err.code || '', err.message)

    if (err.code === 'NO_KEY') {
      return res
        .status(503)
        .json({ error: 'Backend sem GEMINI_API_KEY. Crie um .env a partir do .env.example.', code: 'NO_KEY' })
    }
    res.status(502).json({ error: 'Falha ao gerar o roadmap com a IA.', detail: err.message })
  }
})

app.listen(PORT, () => {
  const keyOk = process.env.GEMINI_API_KEY
  console.log(`\n  🤖 DevPath AI — backend rodando em http://localhost:${PORT}`)
  console.log(`     Modelo:  ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`)
  console.log(`     Gemini:  ${keyOk ? 'chave configurada ✓' : '⚠️  SEM CHAVE (defina GEMINI_API_KEY no .env)'}`)
  console.log(`     Auth:    ${process.env.JWT_SECRET ? 'JWT_SECRET definido ✓' : '⚠️  usando JWT_SECRET padrão (defina um no .env p/ produção)'}`)
  console.log(
    `     Kiwify:  checkout ${process.env.KIWIFY_CHECKOUT_URL ? '✓' : 'não configurado'} · webhook ${
      process.env.KIWIFY_WEBHOOK_TOKEN ? 'token ✓' : '⚠️  sem token'
    }\n`,
  )
})
