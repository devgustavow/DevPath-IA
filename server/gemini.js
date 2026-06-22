import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

/* ============================================================================
 * Integração com a API do Google Gemini.
 * Recebe os dados do dev e devolve um roadmap em sprints (JSON estruturado).
 * A chave (GEMINI_API_KEY) vive SÓ no servidor — nunca chega ao navegador.
 * ==========================================================================*/

// Chaves de ícone que o front sabe renderizar (mapeadas em App.jsx).
export const ICON_KEYS = [
  'boxes', 'database', 'lock', 'server', 'layout',
  'code', 'radio', 'rocket', 'cpu', 'terminal', 'gitbranch', 'activity',
]

/* Schema de saída: força o Gemini a responder um JSON válido e previsível
 * (structured output). Evita ter que "limpar" markdown/texto solto. */
const responseSchema = {
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

/* Monta o prompt enviado ao modelo. Em PT-BR, com a filosofia anti-Tutorial-Hell. */
function buildPrompt({ project, level, hours, stack }) {
  const stackStr = Array.isArray(stack) ? stack.join(', ') : String(stack || '')
  const levelLabel = LEVEL_LABELS[level] || level

  return `Você é um Tech Lead sênior, especialista em "Project-Based Learning" e em tirar
desenvolvedores do "Tutorial Hell". Faça a ENGENHARIA REVERSA do projeto abaixo e
devolva um roadmap PRÁTICO, dividido em sprints semanais.

PROJETO QUE O DEV QUER CONSTRUIR: "${project}"
NÍVEL DO DEV: ${levelLabel}
HORAS DISPONÍVEIS POR SEMANA: ${hours}
STACK DESEJADA: ${stackStr || 'livre — sugira a melhor para o caso'}

REGRAS OBRIGATÓRIAS:
1. Gere de 6 a 9 sprints, na ordem real de construção (do setup do ambiente ao deploy).
2. NENHUMA tarefa pode ser "estudar teoria", "ler sobre" ou "aprender". TODA tarefa
   começa com um verbo de CONSTRUÇÃO concreto: Construir, Implementar, Configurar,
   Criar, Integrar, Dockerizar, Conectar, Modelar, Escrever testes, etc. Cada tarefa
   deve produzir algo testável.
3. Cada sprint tem de 3 a 5 tarefas.
4. "effort" = estimativa realista de horas para o sprint inteiro (entre 8 e 20).
5. "goal" = uma frase curta com o resultado tangível ("Sair com X funcionando").
5b. "checklist" = 2 a 3 critérios objetivos de "pronto" (Definition of Done) — como
    saber, na prática, que o sprint está concluído (ex: "Endpoint responde 200 com JWT
    válido", "Testes da auth passando no CI").
6. "iconKey" deve ser EXATAMENTE uma destas: ${ICON_KEYS.join(', ')}. Escolha a mais
   representativa (database=banco, lock=auth, server=API, layout=UI/telas, code=frontend,
   radio=realtime, rocket=deploy, boxes=setup/fundação, gitbranch=versionamento).
7. Em "dependencies" (2 a 4 itens): aponte PRÉ-REQUISITOS e LACUNAS de conhecimento que
   um dev DESSE nível provavelmente terá, e em qual sprint isso bloqueia. Use
   severity="warning" para lacuna crítica e "info" para recomendação. Em "blocks",
   referencie o sprint (ex: "Sprint 3 · Autenticação").
8. Adapte a profundidade ao nível: Iniciante recebe passos menores e mais guiados;
   Sênior migrando de stack foca nas DIFERENÇAS da nova stack, não no básico.
9. Responda 100% em português do Brasil, com tom direto e motivador.

Devolva SOMENTE o JSON no schema especificado.`
}

/* Chama o Gemini e retorna { sprints, dependencies } já parseado. */
export async function generateRoadmap(input) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY não configurada no backend.')
    err.code = 'NO_KEY'
    throw err
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.85,
    },
  })

  const result = await model.generateContent(buildPrompt(input))
  const text = result.response.text()

  try {
    return JSON.parse(text)
  } catch {
    const err = new Error('A IA não retornou um JSON válido.')
    err.code = 'BAD_JSON'
    throw err
  }
}
