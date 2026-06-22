import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Terminal,
  Cpu,
  GitBranch,
  GitCommit,
  Github,
  Code2,
  Rocket,
  Database,
  Lock,
  Server,
  LayoutDashboard,
  Boxes,
  Radio,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Circle,
  ChevronDown,
  Clock,
  Calendar,
  RefreshCw,
  Zap,
  ArrowRight,
  Loader2,
  X,
  Plus,
  Sparkles,
  TrendingUp,
  Activity,
  Star,
  Users,
  Wand2,
  Check,
  ExternalLink,
  Flame,
} from 'lucide-react'

/* ============================================================================
 * DevPath AI — O Arquiteto de Carreira para Devs
 * ----------------------------------------------------------------------------
 * App de página única (single page) com 3 estados de tela:
 *   1) 'setup'     -> Formulário do dev
 *   2) 'loading'   -> Simulação de "IA" rodando em um terminal fake
 *   3) 'dashboard' -> Roadmap prático em sprints (Project-Based Learning)
 *
 * Stack: React (Hooks) + Tailwind (CDN) + lucide-react.
 * Integração real (sem backend) com a API pública do GitHub.
 * ==========================================================================*/

/* ----------------------------------------------------------------------------
 * MOCK: Roadmap super realista para o projeto exemplo:
 * "SaaS de Gestão de Tarefas usando React e Node".
 *
 * Filosofia anti-Tutorial-Hell: nenhuma tarefa é "estudar teoria".
 * Toda tarefa é "CONSTRUIR / IMPLEMENTAR algo concreto".
 * `effort` = horas estimadas para o sprint (usado no cálculo de cronograma).
 * --------------------------------------------------------------------------*/
const INITIAL_ROADMAP = [
  {
    id: 'sprint-1',
    icon: Boxes,
    title: 'Fundação & Setup do Ambiente',
    goal: 'Sair com um monorepo rodando "hello world" em client + server.',
    effort: 10,
    tasks: [
      { id: 't1-1', title: 'Estruturar o monorepo (apps/web + apps/api) com workspaces', done: false },
      { id: 't1-2', title: 'Inicializar a API Node com Express e a primeira rota /health', done: false },
      { id: 't1-3', title: 'Criar o front com Vite + React + Tailwind e renderizar o layout base', done: false },
      { id: 't1-4', title: 'Configurar ESLint, Prettier e Husky (commit lint)', done: false },
    ],
  },
  {
    id: 'sprint-2',
    icon: Database,
    title: 'Modelagem & Banco de Dados',
    goal: 'Persistir e ler tarefas reais do PostgreSQL.',
    effort: 14,
    tasks: [
      { id: 't2-1', title: 'Subir o PostgreSQL via Docker Compose', done: false },
      { id: 't2-2', title: 'Modelar User, Workspace e Task com Prisma + 1ª migration', done: false },
      { id: 't2-3', title: 'Construir a camada de seed com dados fake (faker)', done: false },
      { id: 't2-4', title: 'Implementar o repositório de Tasks (CRUD no banco)', done: false },
    ],
  },
  {
    id: 'sprint-3',
    icon: Lock,
    title: 'Autenticação (Backend)',
    goal: 'Registrar, logar e proteger rotas com JWT de verdade.',
    effort: 16,
    tasks: [
      { id: 't3-1', title: 'Construir /register e /login com hash de senha (bcrypt)', done: false },
      { id: 't3-2', title: 'Gerar e validar JWT (access + refresh token)', done: false },
      { id: 't3-3', title: 'Criar middleware de autenticação e proteger as rotas privadas', done: false },
      { id: 't3-4', title: 'Escrever testes de integração da auth (Vitest + Supertest)', done: false },
    ],
  },
  {
    id: 'sprint-4',
    icon: Server,
    title: 'API de Tarefas (Backend)',
    goal: 'Expor um CRUD de tarefas robusto, validado e documentado.',
    effort: 14,
    tasks: [
      { id: 't4-1', title: 'Implementar os endpoints REST de CRUD de tarefas', done: false },
      { id: 't4-2', title: 'Adicionar paginação, filtros e ordenação na listagem', done: false },
      { id: 't4-3', title: 'Validar todo payload de entrada com Zod', done: false },
      { id: 't4-4', title: 'Documentar a API com Swagger / OpenAPI', done: false },
    ],
  },
  {
    id: 'sprint-5',
    icon: LayoutDashboard,
    title: 'Frontend — Auth & Layout',
    goal: 'Logar de verdade e navegar pelo app já autenticado.',
    effort: 16,
    tasks: [
      { id: 't5-1', title: 'Construir telas de Login/Registro com React Hook Form', done: false },
      { id: 't5-2', title: 'Criar o AuthContext + rotas protegidas (React Router)', done: false },
      { id: 't5-3', title: 'Montar o shell do app (sidebar, header, toggle de tema)', done: false },
      { id: 't5-4', title: 'Conectar o login real consumindo a API com React Query', done: false },
    ],
  },
  {
    id: 'sprint-6',
    icon: Code2,
    title: 'Frontend — Board de Tarefas',
    goal: 'Entregar o coração do produto: um Kanban funcional.',
    effort: 18,
    tasks: [
      { id: 't6-1', title: 'Construir o board Kanban (colunas To Do / Doing / Done)', done: false },
      { id: 't6-2', title: 'Implementar drag-and-drop entre colunas com dnd-kit', done: false },
      { id: 't6-3', title: 'Criar o modal de criar/editar tarefa', done: false },
      { id: 't6-4', title: 'Sincronizar mutations com optimistic update (React Query)', done: false },
    ],
  },
  {
    id: 'sprint-7',
    icon: Radio,
    title: 'Real-time & Colaboração',
    goal: 'Ver o board atualizar ao vivo entre vários usuários.',
    effort: 14,
    tasks: [
      { id: 't7-1', title: 'Configurar WebSockets (Socket.io) no backend', done: false },
      { id: 't7-2', title: 'Emitir eventos quando uma tarefa muda de status', done: false },
      { id: 't7-3', title: 'Atualizar o board em tempo real no frontend', done: false },
      { id: 't7-4', title: 'Construir o indicador de "usuários online" no workspace', done: false },
    ],
  },
  {
    id: 'sprint-8',
    icon: Rocket,
    title: 'Deploy & Observabilidade',
    goal: 'Colocar o SaaS no ar com CI/CD e monitoramento.',
    effort: 12,
    tasks: [
      { id: 't8-1', title: 'Dockerizar client e server (docker-compose de produção)', done: false },
      { id: 't8-2', title: 'Configurar o pipeline de CI/CD com GitHub Actions', done: false },
      { id: 't8-3', title: 'Deploy do backend (Railway/Render) e front (Vercel)', done: false },
      { id: 't8-4', title: 'Adicionar logging (Pino) e monitoramento de erros (Sentry)', done: false },
    ],
  },
]

/* MOCK: Mapa de dependências / pré-requisitos detectados pela "IA". */
const DEPENDENCY_ALERTS = [
  {
    id: 'dep-1',
    severity: 'warning',
    title: 'Lacuna detectada: JavaScript Assíncrono',
    detail:
      'Antes de construir a API em Node (Sprint 3), você terá 1 módulo prático de Promises, async/await e tratamento de erros — detectamos essa lacuna no seu nível atual.',
    blocks: 'Sprint 3 · Autenticação',
  },
  {
    id: 'dep-2',
    severity: 'info',
    title: 'Pré-requisito: State Management em React',
    detail:
      'O Board Kanban (Sprint 6) exige domínio de estado derivado e listas. Embutimos 2 mini-desafios de hooks dentro do Sprint 5 para você não travar.',
    blocks: 'Sprint 6 · Board de Tarefas',
  },
  {
    id: 'dep-3',
    severity: 'info',
    title: 'Conceito-chave: HTTP & Autenticação stateless',
    detail:
      'JWT pressupõe entender cabeçalhos, status codes e o ciclo request/response. Adicionamos como leitura aplicada dentro do Sprint 3 (sem teoria solta).',
    blocks: 'Sprint 3 · Autenticação',
  },
]

const LEVELS = [
  { value: 'iniciante', label: 'Iniciante', hint: 'Sei o básico de lógica e sintaxe' },
  { value: 'pleno', label: 'Pleno', hint: 'Já entrego features sozinho(a)' },
  { value: 'senior', label: 'Sênior migrando de stack', hint: 'Domino outra stack, quero migrar' },
]

/* Linhas do "boot" da IA no estado de loading (~3s no total). */
const BOOT_SEQUENCE = [
  { text: 'Inicializando DevPath Engine v2.4...', delay: 280 },
  { text: 'Analisando 14.302 repositórios open-source similares...', delay: 600 },
  { text: 'Fazendo engenharia reversa da arquitetura do projeto...', delay: 640 },
  { text: 'Mapeando dependências de código e pré-requisitos...', delay: 560 },
  { text: 'Detectando lacunas de conhecimento no seu perfil...', delay: 480 },
  { text: 'Calculando esforço × horas disponíveis por semana...', delay: 420 },
  { text: 'Gerando sprints práticos (Project-Based Learning)...', delay: 480 },
  { text: 'Arquitetura pronta. Bem-vindo(a) ao fim do Tutorial Hell.', delay: 260, success: true },
]

// Soma dos delays acima — usada como tempo mínimo de exibição do loader,
// para a animação do terminal não ser cortada quando a IA responde rápido.
const BOOT_DURATION = BOOT_SEQUENCE.reduce((acc, l) => acc + l.delay, 0) + 120

/* Mapa de "iconKey" (string vinda da IA) -> componente de ícone do lucide-react. */
const ICONS_BY_KEY = {
  boxes: Boxes,
  database: Database,
  lock: Lock,
  server: Server,
  layout: LayoutDashboard,
  code: Code2,
  radio: Radio,
  rocket: Rocket,
  cpu: Cpu,
  terminal: Terminal,
  gitbranch: GitBranch,
  activity: Activity,
}

/* Converte a resposta JSON do backend (Gemini) no formato interno da UI:
 * adiciona ids estáveis, mapeia o ícone e marca toda tarefa como não concluída. */
function adaptRoadmap(data) {
  const sprints = (data?.sprints || []).map((s, i) => ({
    id: `sprint-${i + 1}`,
    icon: ICONS_BY_KEY[String(s.iconKey || '').toLowerCase()] || Boxes,
    title: s.title || `Sprint ${i + 1}`,
    goal: s.goal || '',
    effort: Number(s.effort) || 12,
    tasks: (s.tasks || []).map((t, j) => ({
      id: `t${i + 1}-${j + 1}`,
      title: typeof t === 'string' ? t : t?.title || '',
      done: false,
    })),
  }))

  const dependencies = (data?.dependencies || []).map((d, i) => ({
    id: `dep-${i + 1}`,
    severity: d.severity === 'warning' ? 'warning' : 'info',
    title: d.title || '',
    detail: d.detail || '',
    blocks: d.blocks || '',
  }))

  return { sprints, dependencies }
}

/* Devolve uma cópia "zerada" do roadmap mock (para reset e fallback). */
const freshRoadmap = () =>
  INITIAL_ROADMAP.map((s) => ({ ...s, tasks: s.tasks.map((t) => ({ ...t, done: false })) }))

/* ----------------------------------------------------------------------------
 * Helpers de data: cada sprint = 1 "janela" de 7 dias a partir de uma data base.
 * `offsetWeeks` permite deslocar todo o cronograma (botão "Recalcular Rota").
 * --------------------------------------------------------------------------*/
const fmtDate = (date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')

function computeSprintWindow(baseDate, weekIndex, offsetWeeks) {
  const start = new Date(baseDate)
  start.setDate(start.getDate() + (weekIndex + offsetWeeks) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end, label: `${fmtDate(start)} – ${fmtDate(end)}` }
}

/* Gera um hash de commit fake estilo git (7 chars). */
const fakeHash = () => Math.random().toString(16).slice(2, 9)

/* ==========================================================================
 * COMPONENTE PRINCIPAL
 * ========================================================================*/
export default function App() {
  // Estado de navegação entre as 3 telas.
  const [view, setView] = useState('setup')

  // Dados do formulário do dev.
  const [form, setForm] = useState({
    project: 'SaaS de Gestão de Tarefas',
    level: 'pleno',
    hours: 10,
    stack: ['React', 'Node.js', 'PostgreSQL'],
  })

  // Roadmap (mutável: marcamos tarefas como concluídas / "commits").
  const [roadmap, setRoadmap] = useState(INITIAL_ROADMAP)

  // Mapa de dependências (vem da IA ou do mock) e origem do roadmap atual.
  const [dependencies, setDependencies] = useState(DEPENDENCY_ALERTS)
  const [source, setSource] = useState('mock') // 'ai' | 'mock'

  // Deslocamento do cronograma em semanas (alimentado por "Recalcular Rota").
  const [offsetWeeks, setOffsetWeeks] = useState(0)

  // Integração GitHub (perfil conectado + log de commits simulados).
  const [github, setGithub] = useState(null)
  const [commits, setCommits] = useState([])

  // Notificação flutuante (toast).
  const [toast, setToast] = useState(null)

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  // Dispara a geração do roadmap chamando o backend (Gemini).
  // Mantém o loader por um tempo mínimo (animação) e cai no mock se a IA falhar.
  const handleGenerate = async () => {
    setView('loading')
    setOffsetWeeks(0)
    setCommits([])

    // Garante que a animação do terminal complete antes de navegar.
    const minDelay = new Promise((resolve) => setTimeout(resolve, BOOT_DURATION))

    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const info = await res.json().catch(() => ({}))
        throw new Error(info.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const adapted = adaptRoadmap(data)
      if (!adapted.sprints.length) throw new Error('A IA retornou um roadmap vazio.')

      await minDelay
      setRoadmap(adapted.sprints)
      setDependencies(adapted.dependencies.length ? adapted.dependencies : DEPENDENCY_ALERTS)
      setSource('ai')
      setView('dashboard')
      showToast('Roadmap gerado pela IA (Gemini) ✓', 'success')
    } catch (err) {
      // Fallback gracioso: usa o roadmap de exemplo (mock) e avisa o usuário.
      await minDelay
      setRoadmap(freshRoadmap())
      setDependencies(DEPENDENCY_ALERTS)
      setSource('mock')
      setView('dashboard')
      showToast('IA indisponível — exibindo roadmap de exemplo. Rode o backend com GEMINI_API_KEY.', 'info')
    }
  }

  // Reinicia o fluxo inteiro, voltando ao formulário.
  const handleReset = () => {
    setRoadmap(freshRoadmap())
    setDependencies(DEPENDENCY_ALERTS)
    setSource('mock')
    setOffsetWeeks(0)
    setCommits([])
    setView('setup')
  }

  /* Marca/desmarca uma tarefa. Marcar = "fazer um commit". */
  const toggleTask = (sprintId, taskId) => {
    let committedTask = null
    setRoadmap((prev) =>
      prev.map((sprint) => {
        if (sprint.id !== sprintId) return sprint
        return {
          ...sprint,
          tasks: sprint.tasks.map((task) => {
            if (task.id !== taskId) return task
            const nowDone = !task.done
            if (nowDone) committedTask = task
            return { ...task, done: nowDone }
          }),
        }
      }),
    )

    // Ao concluir (não ao desfazer), registra um "commit" no log.
    if (committedTask) {
      const message = `feat: ${committedTask.title.toLowerCase()}`
      setCommits((prev) => [
        { hash: fakeHash(), message, time: new Date(), id: Date.now() },
        ...prev,
      ])
      showToast(
        github
          ? `Commit enviado para ${github.login}/devpath-tasks ✓`
          : 'Tarefa commitada! Conecte o GitHub para sincronizar.',
        'success',
      )
    }
  }

  // Recalcula a rota: simula uma semana perdida deslocando o cronograma.
  const handleRecalculate = () => {
    setOffsetWeeks((prev) => prev + 1)
    showToast('Rota recalculada — cronograma ajustado em +1 semana. Sem culpa. 🤝', 'info')
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans antialiased selection:bg-emerald-500/30">
      <Header
        view={view}
        github={github}
        onReset={handleReset}
        commitCount={commits.length}
      />

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        {view === 'setup' && (
          <SetupForm
            form={form}
            setForm={setForm}
            github={github}
            setGithub={setGithub}
            onGenerate={handleGenerate}
            showToast={showToast}
          />
        )}

        {view === 'loading' && <TerminalLoader form={form} />}

        {view === 'dashboard' && (
          <Dashboard
            form={form}
            roadmap={roadmap}
            dependencies={dependencies}
            source={source}
            offsetWeeks={offsetWeeks}
            onToggleTask={toggleTask}
            onRecalculate={handleRecalculate}
            github={github}
            setGithub={setGithub}
            commits={commits}
            showToast={showToast}
          />
        )}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

/* ==========================================================================
 * HEADER (barra superior fixa)
 * ========================================================================*/
function Header({ view, github, onReset, commitCount }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={view !== 'setup' ? onReset : undefined}
          className="group flex items-center gap-2.5 text-left"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-blink rounded-full bg-emerald-400" />
          </span>
          <span className="leading-tight">
            <span className="block font-mono text-sm font-bold tracking-tight text-slate-100">
              DevPath<span className="text-emerald-400">.ai</span>
            </span>
            <span className="block font-mono text-[10px] text-slate-500">
              {'>'} arquiteto de carreira
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {commitCount > 0 && (
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-400 sm:flex">
              <GitCommit className="h-3.5 w-3.5 text-emerald-400" />
              {commitCount} commit{commitCount > 1 ? 's' : ''}
            </span>
          )}

          {github ? (
            <span className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 py-1 pl-1 pr-3">
              <img
                src={github.avatar_url}
                alt={github.login}
                className="h-6 w-6 rounded-full ring-1 ring-emerald-500/40"
              />
              <span className="font-mono text-xs text-slate-300">{github.login}</span>
            </span>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-500 sm:flex">
              <Github className="h-3.5 w-3.5" />
              não conectado
            </span>
          )}

          {view !== 'setup' && (
            <button
              onClick={onReset}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
            >
              novo projeto
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

/* ==========================================================================
 * TELA 1 — FORMULÁRIO DO DEV
 * ========================================================================*/
function SetupForm({ form, setForm, github, setGithub, onGenerate, showToast }) {
  const [tagInput, setTagInput] = useState('')

  const addTag = (raw) => {
    const value = raw.trim().replace(/,$/, '')
    if (!value) return
    if (form.stack.some((t) => t.toLowerCase() === value.toLowerCase())) return
    setForm((f) => ({ ...f, stack: [...f.stack, value] }))
    setTagInput('')
  }

  const removeTag = (tag) => setForm((f) => ({ ...f, stack: f.stack.filter((t) => t !== tag) }))

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && form.stack.length) {
      removeTag(form.stack[form.stack.length - 1])
    }
  }

  const canSubmit = form.project.trim() && form.hours > 0

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" />
          fim do tutorial hell
        </span>
        <h1 className="font-mono text-3xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-4xl md:text-5xl">
          Pare de assistir.{' '}
          <span className="text-gradient">Comece a construir.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
          Diga qual projeto real você quer construir. A DevPath faz a{' '}
          <span className="text-slate-200">engenharia reversa</span> dele e te entrega um roadmap
          prático em sprints — código de verdade, não teoria solta.
        </p>
      </div>

      {/* Card do formulário estilo "janela de editor" */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onGenerate()
        }}
        className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 shadow-2xl shadow-black/40 backdrop-blur"
      >
        {/* Barra de janela */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-xs text-slate-500">dev-setup.config.js</span>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {/* Projeto */}
          <Field
            label="Qual projeto real você quer construir?"
            hint="Seja específico. Ex: Clone do Spotify, API de Pagamentos em Node, Dashboard de Analytics."
          >
            <div className="relative">
              <Code2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={form.project}
                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                placeholder="Ex: SaaS de Gestão de Tarefas"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </Field>

          {/* Nível */}
          <Field label="Qual o seu nível atual?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LEVELS.map((lvl) => {
                const active = form.level === lvl.value
                return (
                  <button
                    type="button"
                    key={lvl.value}
                    onClick={() => setForm((f) => ({ ...f, level: lvl.value }))}
                    className={`rounded-lg border p-3 text-left transition ${
                      active
                        ? 'border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-slate-700 bg-slate-950/40 hover:border-slate-600'
                    }`}
                  >
                    <span
                      className={`block font-mono text-sm font-semibold ${
                        active ? 'text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      {lvl.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                      {lvl.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </Field>

          {/* Horas por semana */}
          <Field
            label="Horas disponíveis por semana"
            hint="Usamos isso para calcular um cronograma honesto — sem prometer milagre."
          >
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hours: Math.max(1, Number(e.target.value) || 0) }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex gap-1.5">
                {[5, 10, 20].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setForm((f) => ({ ...f, hours: h }))}
                    className="rounded-md border border-slate-700 bg-slate-950/40 px-2.5 py-1.5 font-mono text-xs text-slate-400 transition hover:border-emerald-500/50 hover:text-emerald-300"
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Stack desejada (tags) */}
          <Field label="Stack desejada" hint="Pressione Enter ou vírgula para adicionar uma tag.">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-2.5 transition focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20">
              {form.stack.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 font-mono text-xs text-violet-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-violet-300/70 transition hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => addTag(tagInput)}
                placeholder={form.stack.length ? 'adicionar...' : 'Ex: React, Node, PostgreSQL'}
                className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
            </div>
          </Field>

          {/* Conexão GitHub (opcional) */}
          <Field
            label="Conectar GitHub (opcional)"
            hint="Conecte para sincronizar seus 'commits' de progresso com seu perfil real."
          >
            <GithubConnect github={github} setGithub={setGithub} showToast={showToast} />
          </Field>

          {/* CTA principal */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 font-mono text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            <Wand2 className="h-4.5 w-4.5" />
            Gerar Arquitetura do Projeto
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </form>

      <p className="mt-6 text-center font-mono text-xs text-slate-600">
        {'// '} nenhum dado é enviado a um servidor — tudo roda no seu navegador.
      </p>
    </div>
  )
}

/* Campo de formulário com label + hint padronizados. */
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span className="text-emerald-500">{'> '}</span>
        {label}
      </label>
      {hint && <p className="mb-2.5 text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  )
}

/* ==========================================================================
 * INTEGRAÇÃO GITHUB — usa a API pública (sem auth) para puxar o perfil real.
 * ========================================================================*/
function GithubConnect({ github, setGithub, showToast, compact = false }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const connect = async (e) => {
    e?.preventDefault()
    const user = username.trim()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      // Endpoint público: https://api.github.com/users/{username}
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`)
      if (res.status === 404) throw new Error('Usuário não encontrado no GitHub.')
      if (res.status === 403) throw new Error('Limite de requisições da API atingido. Tente em 1 min.')
      if (!res.ok) throw new Error('Falha ao conectar com o GitHub.')
      const data = await res.json()
      setGithub(data)
      showToast?.(`GitHub conectado: ${data.login} ✓`, 'success')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Estado conectado: mostra o card do perfil real.
  if (github) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={github.avatar_url}
            alt={github.login}
            className="h-10 w-10 flex-shrink-0 rounded-full ring-2 ring-emerald-500/40"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-mono text-sm font-semibold text-slate-100">
              {github.name || github.login}
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
            </p>
            <p className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Boxes className="h-3 w-3" />
                {github.public_repos} repos
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {github.followers} seguidores
              </span>
            </p>
          </div>
        </div>
        {!compact && (
          <button
            type="button"
            onClick={() => setGithub(null)}
            className="flex-shrink-0 rounded-md border border-slate-700 px-2.5 py-1.5 font-mono text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
          >
            desconectar
          </button>
        )}
      </div>
    )
  }

  // Estado desconectado: input + botão.
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect(e)}
            placeholder="seu-usuario-github"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <button
          type="button"
          onClick={connect}
          disabled={loading || !username.trim()}
          className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 font-mono text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
          {loading ? 'conectando' : 'conectar'}
        </button>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 font-mono text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

/* ==========================================================================
 * TELA 2 — TERMINAL DE CARREGAMENTO ("IA" trabalhando)
 * ========================================================================*/
function TerminalLoader({ form }) {
  const [lines, setLines] = useState([])
  const timers = useRef([])

  useEffect(() => {
    let elapsed = 0
    // Revela cada linha do BOOT_SEQUENCE de forma sequencial.
    // A navegação para o dashboard é controlada pelo handleGenerate (App),
    // que só avança quando a resposta da IA chega — aqui é só visual.
    BOOT_SEQUENCE.forEach((line, i) => {
      elapsed += line.delay
      const t = setTimeout(() => {
        setLines((prev) => [...prev, { ...line, key: i }])
      }, elapsed)
      timers.current.push(t)
    })

    const snapshot = timers.current
    return () => snapshot.forEach(clearTimeout)
  }, [])

  const progress = Math.round((lines.length / BOOT_SEQUENCE.length) * 100)

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Janela de terminal */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-emerald-500/5 ring-1 ring-emerald-500/10">
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 flex items-center gap-1.5 font-mono text-xs text-slate-500">
              <Cpu className="h-3.5 w-3.5 animate-spin-slow text-emerald-400" />
              devpath-engine — analisando "{form.project}"
            </span>
          </div>

          <div className="min-h-[280px] space-y-2 p-5 font-mono text-sm">
            {lines.map((line) => (
              <div
                key={line.key}
                className={`flex items-start gap-2 animate-fade-in ${
                  line.success ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                <span className={line.success ? 'text-emerald-400' : 'text-emerald-500'}>
                  {line.success ? '✓' : '>'}
                </span>
                <span>{line.text}</span>
              </div>
            ))}
            {/* Cursor piscando enquanto não terminou */}
            {lines.length < BOOT_SEQUENCE.length && (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-500">{'>'}</span>
                <span className="inline-block h-4 w-2 animate-blink bg-emerald-400" />
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-slate-500">
            <span>compilando seu roadmap...</span>
            <span className="text-emerald-400">{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
 * TELA 3 — DASHBOARD DO ROADMAP
 * ========================================================================*/
function Dashboard({
  form,
  roadmap,
  dependencies,
  source,
  offsetWeeks,
  onToggleTask,
  onRecalculate,
  github,
  setGithub,
  commits,
  showToast,
}) {
  // Data base do cronograma = hoje.
  const baseDate = useMemo(() => new Date(), [])

  // Métricas derivadas do roadmap (recalculadas a cada render).
  const stats = useMemo(() => {
    const totalTasks = roadmap.reduce((acc, s) => acc + s.tasks.length, 0)
    const doneTasks = roadmap.reduce((acc, s) => acc + s.tasks.filter((t) => t.done).length, 0)
    const totalEffort = roadmap.reduce((acc, s) => acc + s.effort, 0)
    const calendarWeeks = Math.ceil(totalEffort / form.hours)
    const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0
    // Data estimada de conclusão (com o offset do "recalcular rota").
    const finish = new Date(baseDate)
    finish.setDate(finish.getDate() + (calendarWeeks + offsetWeeks) * 7)
    return { totalTasks, doneTasks, totalEffort, calendarWeeks, percent, finish }
  }, [roadmap, form.hours, baseDate, offsetWeeks])

  return (
    <div className="animate-fade-in space-y-8">
      {/* Cabeçalho do projeto */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <GitBranch className="h-3.5 w-3.5" />
            roadmap/{form.project.toLowerCase().replace(/\s+/g, '-')}
          </span>
          <h2 className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl">
            {form.project}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Badge: roadmap veio da IA (Gemini) ou é o exemplo mockado. */}
            <span
              className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs ${
                source === 'ai'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400'
              }`}
            >
              {source === 'ai' ? (
                <>
                  <Sparkles className="h-3 w-3" /> gerado por IA · Gemini
                </>
              ) : (
                <>
                  <Cpu className="h-3 w-3" /> roadmap de exemplo
                </>
              )}
            </span>
            <span className="rounded-md border border-slate-800 bg-slate-900/60 px-2 py-0.5 font-mono text-xs capitalize text-slate-400">
              {LEVELS.find((l) => l.value === form.level)?.label}
            </span>
            {form.stack.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-xs text-violet-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Botão de destaque: Recalcular Rota */}
        <button
          onClick={onRecalculate}
          className="group flex items-center justify-center gap-2 self-start rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 font-mono text-sm font-semibold text-blue-200 shadow-lg shadow-blue-500/10 transition hover:bg-blue-500/20 hover:shadow-blue-500/30 sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
          Recalcular Rota
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Semanas estimadas"
          value={stats.calendarWeeks + offsetWeeks}
          sub={`${form.hours}h por semana`}
          tone="emerald"
        />
        <StatCard
          icon={Clock}
          label="Esforço total"
          value={`${stats.totalEffort}h`}
          sub={`${roadmap.length} sprints`}
          tone="violet"
        />
        <StatCard
          icon={Flame}
          label="Conclusão prevista"
          value={fmtDate(stats.finish)}
          sub={offsetWeeks > 0 ? `+${offsetWeeks} sem. ajustada` : 'no ritmo planejado'}
          tone="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Progresso"
          value={`${stats.percent}%`}
          sub={`${stats.doneTasks}/${stats.totalTasks} tarefas`}
          tone="emerald"
          progress={stats.percent}
        />
      </div>

      {/* Aviso de recálculo */}
      {offsetWeeks > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 animate-fade-in">
          <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
          <p className="text-sm text-slate-300">
            <span className="font-mono font-semibold text-blue-300">Rota recalculada {offsetWeeks}×.</span>{' '}
            Tudo bem perder uma semana — a vida acontece. Suas datas foram empurradas em{' '}
            <span className="font-mono text-blue-300">+{offsetWeeks} semana(s)</span> sem mexer no
            escopo. Consistência {'>'} velocidade.
          </p>
        </div>
      )}

      {/* Layout principal: timeline (esquerda) + side (direita) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Coluna principal: a Timeline de sprints */}
        <div className="lg:col-span-2">
          <SectionTitle icon={GitBranch} title="Timeline Prática" subtitle="Project-Based Learning · 1 sprint por semana" />
          <div className="relative space-y-4">
            {/* Linha vertical conectando os sprints */}
            <div className="absolute bottom-4 left-[22px] top-4 w-px bg-gradient-to-b from-emerald-500/40 via-slate-700 to-transparent" />
            {roadmap.map((sprint, index) => (
              <SprintCard
                key={sprint.id}
                sprint={sprint}
                index={index}
                window={computeSprintWindow(baseDate, index, offsetWeeks)}
                onToggleTask={onToggleTask}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Coluna lateral: dependências + github + commits */}
        <div className="space-y-8">
          {/* Mapa de dependências */}
          <div>
            <SectionTitle
              icon={AlertTriangle}
              title="Mapa de Dependências"
              subtitle="Pré-requisitos detectados pela IA"
            />
            <div className="space-y-3">
              {dependencies.map((alert) => (
                <DependencyAlert key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          {/* Integração GitHub */}
          <div>
            <SectionTitle icon={Github} title="Integração GitHub" subtitle="Sincronize seu progresso" />
            <GithubConnect github={github} setGithub={setGithub} showToast={showToast} />
            {github && (
              <a
                href={github.profile_url || `https://github.com/${github.login}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center justify-center gap-1.5 font-mono text-xs text-slate-500 transition hover:text-emerald-400"
              >
                ver perfil no github <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Log de commits (gerado ao concluir tarefas) */}
          <CommitLog commits={commits} github={github} />
        </div>
      </div>
    </div>
  )
}

/* Título de seção padronizado. */
function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-900/60">
        <Icon className="h-4 w-4 text-emerald-400" />
      </span>
      <div>
        <h3 className="font-mono text-sm font-bold text-slate-100">{title}</h3>
        <p className="font-mono text-[11px] text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

/* Card de métrica do resumo. */
function StatCard({ icon: Icon, label, value, sub, tone = 'emerald', progress }) {
  const tones = {
    emerald: 'text-emerald-400 border-emerald-500/20',
    violet: 'text-violet-400 border-violet-500/20',
    blue: 'text-blue-400 border-blue-500/20',
  }
  return (
    <div className={`rounded-xl border bg-slate-900/40 p-4 backdrop-blur ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-4.5 w-4.5" />
        {typeof progress === 'number' && (
          <span className="font-mono text-[10px] text-slate-500">{progress}%</span>
        )}
      </div>
      <p className="mt-3 font-mono text-2xl font-extrabold text-slate-100">{value}</p>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
      {typeof progress === 'number' && (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/* Alerta de dependência / pré-requisito. */
function DependencyAlert({ alert }) {
  const isWarning = alert.severity === 'warning'
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        isWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex-shrink-0">
          {isWarning ? (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          ) : (
            <Lightbulb className="h-4 w-4 text-blue-400" />
          )}
        </span>
        <div>
          <p
            className={`font-mono text-xs font-bold ${
              isWarning ? 'text-amber-300' : 'text-blue-300'
            }`}
          >
            {alert.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{alert.detail}</p>
          <span className="mt-2 inline-block rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
            bloqueia: {alert.blocks}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
 * CARD DE SPRINT (semana) — expansível, com tarefas "commitáveis".
 * ========================================================================*/
function SprintCard({ sprint, index, window, onToggleTask, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)

  const doneCount = sprint.tasks.filter((t) => t.done).length
  const total = sprint.tasks.length
  const complete = doneCount === total
  const percent = Math.round((doneCount / total) * 100)
  const Icon = sprint.icon

  return (
    <div className="relative pl-12">
      {/* Marcador na timeline */}
      <span
        className={`absolute left-0 top-3 z-10 grid h-11 w-11 place-items-center rounded-xl border transition ${
          complete
            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
            : 'border-slate-700 bg-slate-900 text-slate-400'
        }`}
      >
        {complete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>

      <div
        className={`overflow-hidden rounded-xl border bg-slate-900/40 backdrop-blur transition ${
          complete ? 'border-emerald-500/30' : 'border-slate-800'
        }`}
      >
        {/* Cabeçalho clicável (expandir/recolher) */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-800/30"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
                Sprint {index + 1}
              </span>
              <span className="font-mono text-[11px] text-slate-600">·</span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <Calendar className="h-3 w-3" />
                {window.label}
              </span>
            </div>
            <h4 className="mt-0.5 truncate font-mono text-sm font-bold text-slate-100">
              {sprint.title}
            </h4>
            <p className="mt-0.5 truncate text-xs text-slate-500">🎯 {sprint.goal}</p>
          </div>

          {/* Progresso do sprint + chevron */}
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="font-mono text-xs text-slate-500">
                {doneCount}/{total}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Lista de tarefas (expandida) */}
        {open && (
          <div className="border-t border-slate-800/80 p-2 animate-fade-in">
            {sprint.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(sprint.id, task.id)}
              />
            ))}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                <Zap className="h-3 w-3 text-amber-500" />
                esforço estimado: {sprint.effort}h
              </span>
              {complete && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  sprint concluído
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Linha de tarefa — botão de "commit" (marcar como concluída). */
function TaskRow({ task, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-800/40"
    >
      <span className="flex-shrink-0">
        {task.done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Circle className="h-5 w-5 text-slate-600 transition group-hover:text-emerald-500/60" />
        )}
      </span>
      <span
        className={`flex-1 text-sm transition ${
          task.done ? 'text-slate-500 line-through' : 'text-slate-200'
        }`}
      >
        {task.title}
      </span>
      {/* "Botão" de commit que aparece no hover */}
      <span
        className={`flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] transition ${
          task.done
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-slate-700 bg-slate-900/60 text-slate-500 opacity-0 group-hover:opacity-100'
        }`}
      >
        <GitCommit className="h-3 w-3" />
        {task.done ? 'committed' : 'commit'}
      </span>
    </button>
  )
}

/* ==========================================================================
 * LOG DE COMMITS — preenchido conforme o dev marca tarefas como concluídas.
 * ========================================================================*/
function CommitLog({ commits, github }) {
  return (
    <div>
      <SectionTitle icon={GitCommit} title="Commits Recentes" subtitle="Seu progresso vira histórico" />
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-3 py-2">
          <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-mono text-xs text-slate-400">
            {github ? `${github.login}/devpath-tasks` : 'local/devpath-tasks'}
          </span>
          <span className="ml-auto font-mono text-[10px] text-slate-600">main</span>
        </div>

        {commits.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <GitCommit className="mx-auto h-6 w-6 text-slate-700" />
            <p className="mt-2 font-mono text-xs text-slate-600">
              nenhum commit ainda
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Conclua uma tarefa para registrar seu primeiro commit.
            </p>
          </div>
        ) : (
          <div className="max-h-72 space-y-px overflow-y-auto p-2">
            {commits.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-2.5 rounded-md px-2 py-2 transition hover:bg-slate-800/40 animate-slide-in"
              >
                <span className="mt-0.5 flex-shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                  {c.hash}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-slate-300">{c.message}</p>
                  <p className="font-mono text-[10px] text-slate-600">
                    {c.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {github && ` · pushed to ${github.login}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ==========================================================================
 * TOAST — notificação flutuante.
 * ========================================================================*/
function Toast({ toast, onClose }) {
  if (!toast) return null
  const isInfo = toast.tone === 'info'
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4 animate-fade-in-up">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
          isInfo
            ? 'border-blue-500/40 bg-blue-950/80'
            : 'border-emerald-500/40 bg-emerald-950/80'
        }`}
      >
        <span className={isInfo ? 'text-blue-400' : 'text-emerald-400'}>
          {isInfo ? <Activity className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        </span>
        <span className="font-mono text-sm text-slate-100">{toast.message}</span>
        <button onClick={onClose} className="ml-2 text-slate-500 transition hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
