import express from 'express'
import { SchemaType } from '@google/generative-ai'
import { runGeminiJSON, runGeminiText } from './gemini.js'

/* ============================================================================
 * Funcionalidades de IA (além do roadmap):
 *  - /suggest-features  : escopo dinâmico (checkboxes de features)
 *  - /boilerplate       : script de terminal + árvore de pastas
 *  - /review-code       : micro code review de um sprint
 *  - /rubber-duck       : pato de borracha socrático (pistas, não respostas)
 *  - /portfolio-readme  : README.md de portfólio (projeto 100% concluído)
 * ==========================================================================*/

const router = express.Router()

function handleErr(res, err) {
  if (err.code === 'NO_KEY') {
    return res.status(503).json({ error: 'Backend sem GEMINI_API_KEY. Configure o .env.', code: 'NO_KEY' })
  }
  console.error('[features]', err.code || '', err.message)
  return res.status(502).json({ error: 'Falha ao chamar a IA.', detail: err.message })
}

const S = SchemaType

/* ---- 5. Escopo dinâmico (features sugeridas) ---------------------------- */
const featuresSchema = {
  type: S.OBJECT,
  properties: {
    features: {
      type: S.ARRAY,
      items: {
        type: S.OBJECT,
        properties: {
          label: { type: S.STRING, description: 'Nome curto da feature.' },
          description: { type: S.STRING, description: 'O que ela agrega, em 1 linha.' },
          weeks: { type: S.NUMBER, description: 'Semanas extras estimadas (0.5 a 3).' },
          recommended: { type: S.BOOLEAN, description: 'Se faz parte de um MVP saudável.' },
        },
        required: ['label', 'description', 'weeks', 'recommended'],
      },
    },
  },
  required: ['features'],
}

router.post('/suggest-features', async (req, res) => {
  const { project, stack, level } = req.body || {}
  if (!project) return res.status(400).json({ error: 'Informe o projeto.' })
  try {
    const prompt = `Você é um Product Engineer. O dev quer construir: "${project}" (stack: ${
      (Array.isArray(stack) ? stack.join(', ') : stack) || 'livre'
    }, nível: ${level || 'pleno'}).
Liste de 6 a 9 FEATURES OPCIONAIS que ele pode incluir ou não no escopo (ex: "Login social com Google",
"Painel de admin", "E-mails transacionais", "Busca com filtros"). Para cada uma, estime "weeks" (semanas
extras de trabalho, de 0.5 a 3) e marque "recommended" como true se ela faz parte de um MVP saudável.
Responda em português do Brasil. Não inclua o que já é óbvio/essencial (auth básica, banco).`
    const data = await runGeminiJSON({ prompt, schema: featuresSchema, temperature: 0.9 })
    res.json(data)
  } catch (err) {
    handleErr(res, err)
  }
})

/* ---- 2. Boilerplate (script + árvore de pastas) ------------------------- */
const boilerplateSchema = {
  type: S.OBJECT,
  properties: {
    script: { type: S.STRING, description: 'Script bash com mkdir/touch/init para criar a estrutura.' },
    tree: {
      type: S.ARRAY,
      description: 'Lista de arquivos/pastas. Pastas terminam com "/".',
      items: {
        type: S.OBJECT,
        properties: {
          path: { type: S.STRING, description: 'Caminho relativo (ex: src/index.js).' },
          content: { type: S.STRING, description: 'Conteúdo inicial (opcional, p/ arquivos-chave).' },
        },
        required: ['path'],
      },
    },
    notes: { type: S.STRING, description: 'Observações curtas sobre a arquitetura.' },
  },
  required: ['script', 'tree'],
}

router.post('/boilerplate', async (req, res) => {
  const { project, stack, features } = req.body || {}
  if (!project) return res.status(400).json({ error: 'Informe o projeto.' })
  try {
    const prompt = `Você é um arquiteto de software. Gere a ESTRUTURA INICIAL de pastas/arquivos para o projeto:
"${project}" (stack: ${(Array.isArray(stack) ? stack.join(', ') : stack) || 'sugira a melhor'}${
      Array.isArray(features) && features.length ? `, features: ${features.join(', ')}` : ''
    }).
- "script": um script bash pronto para colar no terminal, usando mkdir -p e touch, e os inits da stack
  (npm init -y, criação de package.json/requirements.txt/pom.xml conforme a stack), criando uma arquitetura
  REAL e organizada (separe camadas, ex: routes/controllers/services, ou components/hooks/lib).
- "tree": a lista de caminhos resultante. Para 4 a 8 arquivos-CHAVE (ex: package.json, README.md, index, config),
  preencha "content" com um boilerplate mínimo e funcional. Pastas terminam com "/".
- "notes": 1 a 2 frases sobre as decisões de arquitetura.
Responda em português do Brasil.`
    const data = await runGeminiJSON({ prompt, schema: boilerplateSchema, temperature: 0.6 })
    res.json(data)
  } catch (err) {
    handleErr(res, err)
  }
})

/* ---- 3. Validador de Sprint (micro code review) ------------------------- */
const reviewSchema = {
  type: S.OBJECT,
  properties: {
    verdict: { type: S.STRING, description: '"aprovado", "ajustes" ou "refazer".' },
    summary: { type: S.STRING, description: 'Resumo do review em 1-2 frases.' },
    positives: { type: S.ARRAY, items: { type: S.STRING }, description: 'O que está bom.' },
    issues: {
      type: S.ARRAY,
      items: {
        type: S.OBJECT,
        properties: {
          severity: { type: S.STRING, description: '"alta", "media" ou "baixa".' },
          title: { type: S.STRING },
          detail: { type: S.STRING, description: 'O problema + como melhorar (sem reescrever tudo).' },
        },
        required: ['severity', 'title', 'detail'],
      },
    },
  },
  required: ['verdict', 'summary', 'positives', 'issues'],
}

router.post('/review-code', async (req, res) => {
  const { code, sprintTitle, stack } = req.body || {}
  if (!code || !String(code).trim()) return res.status(400).json({ error: 'Cole o código para revisar.' })
  if (String(code).length > 12000) return res.status(400).json({ error: 'Código muito grande (máx. ~12k caracteres).' })
  try {
    const prompt = `Você é um dev SÊNIOR fazendo code review do Pull Request de um colega no sprint
"${sprintTitle || 'atual'}" (stack: ${(Array.isArray(stack) ? stack.join(', ') : stack) || 'detecte pela linguagem'}).
Seja técnico, direto e construtivo. Aponte bugs, problemas de performance/segurança, code smells e boas práticas
específicas da linguagem. NÃO reescreva o código inteiro — dê direção. Defina "verdict": "aprovado" (pronto),
"ajustes" (bom, mas tem pontos) ou "refazer" (problemas sérios). Responda em português do Brasil.

CÓDIGO:
\`\`\`
${code}
\`\`\``
    const data = await runGeminiJSON({ prompt, schema: reviewSchema, temperature: 0.4 })
    res.json(data)
  } catch (err) {
    handleErr(res, err)
  }
})

/* ---- 4. Pato de Borracha (socrático) ------------------------------------ */
const duckSchema = {
  type: S.OBJECT,
  properties: {
    questions: { type: S.ARRAY, items: { type: S.STRING }, description: 'Perguntas socráticas que guiam o raciocínio.' },
    hints: { type: S.ARRAY, items: { type: S.STRING }, description: 'Pistas/direções, SEM dar a resposta pronta.' },
    docs: {
      type: S.ARRAY,
      items: {
        type: S.OBJECT,
        properties: { label: { type: S.STRING }, url: { type: S.STRING } },
        required: ['label', 'url'],
      },
      description: 'Links da documentação OFICIAL relevante.',
    },
  },
  required: ['questions', 'hints'],
}

router.post('/rubber-duck', async (req, res) => {
  const { task, project, stack, blocker } = req.body || {}
  if (!task) return res.status(400).json({ error: 'Informe a tarefa.' })
  try {
    const prompt = `Você é um mentor sênior usando o método do "Pato de Borracha". O dev está TRAVADO na tarefa:
"${task}" (projeto: "${project || '-'}", stack: ${(Array.isArray(stack) ? stack.join(', ') : stack) || '-'}).
${blocker ? `Ele descreveu o problema assim: "${blocker}".` : ''}
REGRA DE OURO: NÃO entregue a solução/código pronto — isso estraga o aprendizado. Em vez disso:
- "questions": 3 a 4 perguntas socráticas que o façam pensar e localizar o erro sozinho.
- "hints": 2 a 3 pistas/direções (conceitos a investigar), sem dar a resposta.
- "docs": 1 a 3 links para a DOCUMENTAÇÃO OFICIAL pertinente.
Responda em português do Brasil, tom encorajador.`
    const data = await runGeminiJSON({ prompt, schema: duckSchema, temperature: 0.7 })
    res.json(data)
  } catch (err) {
    handleErr(res, err)
  }
})

/* ---- 6. README de portfólio --------------------------------------------- */
router.post('/portfolio-readme', async (req, res) => {
  const { project, stack, sprints, challenges } = req.body || {}
  if (!project) return res.status(400).json({ error: 'Informe o projeto.' })
  try {
    const built = Array.isArray(sprints) ? sprints.map((s) => `- ${s.title}: ${(s.tasks || []).join('; ')}`).join('\n') : ''
    const prompt = `Você é um dev sênior escrevendo um README.md DE PORTFÓLIO impecável para o GitHub, em português do
Brasil, formato Markdown. O projeto "${project}" foi 100% concluído.
Stack: ${(Array.isArray(stack) ? stack.join(', ') : stack) || '-'}.
O que foi construído (por sprint):
${built || '- (use a stack para inferir)'}
${challenges ? `Desafios citados pelo dev: ${challenges}` : ''}

O README deve conter, com badges shields.io e emojis tasteful:
título + tagline, descrição do projeto, ✨ funcionalidades, 🛠️ tecnologias, 🚀 como rodar localmente
(passo a passo com blocos de código), 🧠 maiores desafios técnicos superados, e 📄 licença.
Responda SOMENTE com o conteúdo Markdown do README (sem comentários extras, sem cercas \`\`\`markdown ao redor).`
    const markdown = await runGeminiText({ prompt, temperature: 0.75 })
    res.json({ markdown })
  } catch (err) {
    handleErr(res, err)
  }
})

export default router
