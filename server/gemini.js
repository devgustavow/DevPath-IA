import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

/* ============================================================================
 * Integração com o Google Gemini.
 * Helpers reutilizáveis (runGeminiJSON / runGeminiText) + geração do roadmap.
 * A chave (GEMINI_API_KEY) vive SÓ no servidor — nunca chega ao navegador.
 * ==========================================================================*/

export const ICON_KEYS = [
  'boxes', 'database', 'lock', 'server', 'layout',
  'code', 'radio', 'rocket', 'cpu', 'terminal', 'gitbranch', 'activity',
]

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY não configurada no backend.')
    err.code = 'NO_KEY'
    throw err
  }
  return new GoogleGenerativeAI(apiKey)
}

/* Gera JSON estruturado (structured output) a partir de um prompt + schema. */
export async function runGeminiJSON({ prompt, schema, temperature = 0.8 }) {
  const model = getClient().getGenerativeModel({
    model: MODEL(),
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature },
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  try {
    return JSON.parse(text)
  } catch {
    const err = new Error('A IA não retornou um JSON válido.')
    err.code = 'BAD_JSON'
    throw err
  }
}

/* Gera texto livre (ex: README em markdown). */
export async function runGeminiText({ prompt, temperature = 0.7 }) {
  const model = getClient().getGenerativeModel({ model: MODEL(), generationConfig: { temperature } })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

/* -------------------------------------------------------------------------- */
/* ROADMAP                                                                     */
/* -------------------------------------------------------------------------- */

const roadmapSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sprints: {
      type: SchemaType.ARRAY,
      description: 'Sprints semanais, em ordem de construção (setup -> deploy).',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          goal: { type: SchemaType.STRING, description: 'Resultado tangível do sprint.' },
          effort: { type: SchemaType.INTEGER, description: 'Horas estimadas (8 a 20).' },
          iconKey: { type: SchemaType.STRING, description: `Uma de: ${ICON_KEYS.join(', ')}` },
          tasks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Tarefas PRÁTICAS (construir/implementar), nunca "estudar".',
          },
          checklist: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Definition of Done: 2 a 3 critérios objetivos de "pronto".',
          },
        },
        required: ['title', 'goal', 'effort', 'iconKey', 'tasks', 'checklist'],
      },
    },
    dependencies: {
      type: SchemaType.ARRAY,
      description: 'Pré-requisitos e lacunas de conhecimento detectadas.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: { type: SchemaType.STRING, description: '"warning" ou "info".' },
          title: { type: SchemaType.STRING },
          detail: { type: SchemaType.STRING },
          blocks: { type: SchemaType.STRING, description: 'Ex: "Sprint 3 · Autenticação".' },
        },
        required: ['severity', 'title', 'detail', 'blocks'],
      },
    },
  },
  required: ['sprints', 'dependencies'],
}

const LEVEL_LABELS = {
  iniciante: 'Iniciante (sabe o básico de lógica e sintaxe)',
  pleno: 'Pleno (já entrega features sozinho)',
  senior: 'Sênior migrando de stack (domina outra stack)',
}

function buildRoadmapPrompt({ project, level, hours, stack, features }) {
  const stackStr = Array.isArray(stack) ? stack.join(', ') : String(stack || '')
  const levelLabel = LEVEL_LABELS[level] || level
  const featuresStr = Array.isArray(features) && features.length ? features.join('; ') : ''

  return `Você é um Tech Lead sênior, especialista em "Project-Based Learning" e em tirar
desenvolvedores do "Tutorial Hell". Faça a ENGENHARIA REVERSA do projeto abaixo e
devolva um roadmap PRÁTICO, dividido em sprints semanais.

PROJETO QUE O DEV QUER CONSTRUIR: "${project}"
NÍVEL DO DEV: ${levelLabel}
HORAS DISPONÍVEIS POR SEMANA: ${hours}
STACK DESEJADA: ${stackStr || 'livre — sugira a melhor para o caso'}
${featuresStr ? `ESCOPO/FEATURES SELECIONADAS (inclua TODAS e ajuste o nº de sprints a elas): ${featuresStr}` : ''}

REGRAS OBRIGATÓRIAS:
1. Gere de 6 a 10 sprints, na ordem real de construção (do setup do ambiente ao deploy).
2. NENHUMA tarefa pode ser "estudar teoria", "ler sobre" ou "aprender". TODA tarefa
   começa com um verbo de CONSTRUÇÃO concreto: Construir, Implementar, Configurar,
   Criar, Integrar, Dockerizar, Conectar, Modelar, Escrever testes, etc.
3. Cada sprint tem de 3 a 5 tarefas.
4. "effort" = estimativa realista de horas para o sprint inteiro (entre 8 e 20).
5. "goal" = uma frase curta com o resultado tangível ("Sair com X funcionando").
5b. "checklist" = 2 a 3 critérios objetivos de "pronto" (Definition of Done).
6. "iconKey" deve ser EXATAMENTE uma destas: ${ICON_KEYS.join(', ')}.
7. Em "dependencies" (2 a 4 itens): aponte PRÉ-REQUISITOS e LACUNAS de conhecimento
   do nível do dev e em qual sprint isso bloqueia. severity="warning" (crítico) ou "info".
8. Adapte a profundidade ao nível. Responda 100% em português do Brasil.

Devolva SOMENTE o JSON no schema especificado.`
}

export async function generateRoadmap(input) {
  return runGeminiJSON({ prompt: buildRoadmapPrompt(input), schema: roadmapSchema, temperature: 0.85 })
}
