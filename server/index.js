import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { generateRoadmap } from './gemini.js'

/* ============================================================================
 * Backend do DevPath AI — API mínima em Express.
 *   POST /api/roadmap  -> gera o roadmap com o Gemini
 *   GET  /api/health   -> status do serviço
 * ==========================================================================*/

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001

// Healthcheck (útil para o front saber se o backend/chave estão de pé).
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  })
})

// Geração do roadmap a partir dos dados do formulário do dev.
app.post('/api/roadmap', async (req, res) => {
  const { project, level, hours, stack } = req.body || {}

  if (!project || !String(project).trim()) {
    return res.status(400).json({ error: 'Informe o projeto que deseja construir.' })
  }

  try {
    const data = await generateRoadmap({
      project: String(project).trim(),
      level: level || 'pleno',
      hours: Number(hours) || 10,
      stack: stack || [],
    })
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
  console.log(`     Modelo:  ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`)
  console.log(`     Gemini:  ${keyOk ? 'chave configurada ✓' : '⚠️  SEM CHAVE (defina GEMINI_API_KEY no .env)'}\n`)
})
