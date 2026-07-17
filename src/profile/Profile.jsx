import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import {
  Flame,
  Shield,
  Trophy,
  Calendar,
  GitBranch,
  Clock,
  Layers,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  FolderGit2,
  Sparkles,
  Target,
  Rocket,
  Award,
  Zap,
} from 'lucide-react'

/* ============================================================================
 * Dashboard do PERFIL: progressão (ofensiva/defensiva), projeto atual e os
 * últimos posts/compartilhamentos do usuário. Visual "premium" com gradientes.
 * ==========================================================================*/

const TAG_CLS = {
  carreira: 'text-blue-300 border-blue-500/30 bg-blue-500/10',
  duvida: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  showoff: 'text-pink-300 border-pink-500/30 bg-pink-500/10',
  roadmap: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  recurso: 'text-violet-300 border-violet-500/30 bg-violet-500/10',
  vaga: 'text-teal-300 border-teal-500/30 bg-teal-500/10',
}

const STREAK_STATUS = {
  active: { text: 'Você praticou hoje! Ofensiva mantida.', cls: 'text-emerald-300' },
  pending: { text: 'Pratique hoje para não perder a ofensiva.', cls: 'text-amber-300' },
  at_risk: { text: 'Você faltou, mas um escudo está te protegendo.', cls: 'text-blue-300' },
  broken: { text: 'Ofensiva zerada. Bora recomeçar hoje!', cls: 'text-slate-400' },
  idle: { text: 'Comece sua ofensiva: conclua uma tarefa hoje.', cls: 'text-slate-400' },
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export default function Profile({ user, onGoRoadmap, onOpenRoadmap, onOpenPost, onUpgrade, showToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.dashboard())
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 font-mono text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> carregando seu perfil...
      </div>
    )
  }

  const { streak, currentProject, stats, posts } = data
  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div className="animate-fade-in space-y-6">
      {/* ---- Cabeçalho do perfil (faixa com gradiente) ---- */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl font-mono text-2xl font-extrabold text-slate-950 shadow-lg"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="font-mono text-2xl font-extrabold tracking-tight text-slate-100">@{user.username}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> membro desde {memberSince}
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <Award className="h-3 w-3" /> {stats.karma} de karma
              </span>
            </p>
          </div>
          <div className="ml-auto hidden gap-2 sm:flex">
            <MiniStat icon={Rocket} label="posts" value={stats.posts} />
            <MiniStat icon={MessageSquare} label="comentários" value={stats.comments} />
          </div>
        </div>
      </div>

      {/* ---- Progressão: Ofensiva (streak) + Defensiva (escudos) ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ofensiva */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-500/5 to-transparent p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/20">
                <Flame className={`h-7 w-7 ${streak.count > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-orange-300/80">Ofensiva</p>
                <p className="font-mono text-3xl font-extrabold text-slate-100">
                  {streak.count}
                  <span className="ml-1 text-base font-bold text-slate-400">dias</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 font-mono text-xs text-slate-400">
                <Trophy className="h-3.5 w-3.5 text-amber-400" /> recorde
              </p>
              <p className="font-mono text-xl font-bold text-slate-200">{streak.longest}</p>
            </div>
          </div>
          <p className={`mt-3 font-mono text-xs ${STREAK_STATUS[streak.status]?.cls || 'text-slate-400'}`}>
            {STREAK_STATUS[streak.status]?.text}
          </p>
          {/* trilha de 7 dias (visual) */}
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
              const filled = i < Math.min(streak.count % 7 || (streak.count ? 7 : 0), 7)
              return (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${filled ? 'bg-orange-400' : 'bg-slate-800'}`}
                />
              )
            })}
          </div>
        </div>

        {/* Defensiva */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-indigo-500/5 to-transparent p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/20">
              <Shield className="h-7 w-7 text-blue-400" />
            </span>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-blue-300/80">Defensiva</p>
              <p className="font-mono text-3xl font-extrabold text-slate-100">
                {streak.freezes}
                <span className="ml-1 text-base font-bold text-slate-400">escudos</span>
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Shield
                key={i}
                className={`h-5 w-5 ${i < streak.freezes ? 'text-blue-400' : 'text-slate-700'}`}
                fill={i < streak.freezes ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-slate-500">Protegem sua ofensiva quando você falha um dia.</p>
        </div>
      </div>

      {/* ---- Plano & uso do mês ---- */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${
              data.plan === 'pro'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-700 bg-slate-950/60 text-slate-300'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {data.plan === 'pro' ? 'Plano Pro' : 'Plano Free'}
          </span>
          {data.plan === 'pro' ? (
            <span className="font-mono text-[11px] text-slate-400">features de IA sem limites — bom código! ⚡</span>
          ) : (
            data.usage && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-400">
                <span>
                  roadmaps IA:{' '}
                  <span className="text-slate-200">
                    {data.usage.roadmapGen.used}/{data.usage.roadmapGen.limit}
                  </span>
                  /mês
                </span>
                <span>
                  features premium:{' '}
                  <span className="text-slate-200">
                    {data.usage.premiumAi.used}/{data.usage.premiumAi.limit}
                  </span>
                  /mês
                </span>
                <span>
                  salvos:{' '}
                  <span className="text-slate-200">
                    {data.usage.savedRoadmaps.used}/{data.usage.savedRoadmaps.limit ?? '∞'}
                  </span>
                </span>
              </div>
            )
          )}
        </div>
        {data.plan !== 'pro' && (
          <button
            onClick={onUpgrade}
            className="flex flex-shrink-0 items-center gap-1.5 self-start rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-mono text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 sm:self-auto"
          >
            <Zap className="h-3.5 w-3.5" /> Fazer upgrade
          </button>
        )}
      </div>

      {/* ---- Trabalhando em + Últimos posts ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projeto atual */}
        <div className="lg:col-span-1">
          <SectionLabel icon={Target} title="Trabalhando em" />
          {currentProject ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
              <div className="flex items-center gap-2 font-mono text-xs text-emerald-300">
                <GitBranch className="h-3.5 w-3.5" />
                roadmap ativo
              </div>
              <h3 className="mt-1.5 text-lg font-bold text-slate-100">{currentProject.project}</h3>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-slate-400">
                {currentProject.weeks != null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-emerald-400" /> {currentProject.weeks} semanas
                  </span>
                )}
                {currentProject.totalEffort != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-emerald-400" /> {currentProject.totalEffort}h
                  </span>
                )}
                {currentProject.sprintsCount != null && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-emerald-400" /> {currentProject.sprintsCount} sprints
                  </span>
                )}
              </div>
              {/* Progresso */}
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                    style={{ width: `${currentProject.progress || 0}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-slate-400">{currentProject.progress || 0}%</span>
              </div>
              <button
                onClick={() => onOpenRoadmap(currentProject.id)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-2 font-mono text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                continuar roadmap <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
              <FolderGit2 className="mx-auto h-7 w-7 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">Você ainda não tem um projeto ativo.</p>
              <button
                onClick={onGoRoadmap}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 font-mono text-xs font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
              >
                <Sparkles className="h-3.5 w-3.5" /> Gerar meu roadmap
              </button>
            </div>
          )}
        </div>

        {/* Últimos compartilhamentos e posts */}
        <div className="lg:col-span-2">
          <SectionLabel icon={TrendingUp} title="Últimos compartilhamentos e posts" />
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-slate-600" />
              <p className="mt-2 text-sm text-slate-400">Você ainda não publicou nada na comunidade.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {posts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenPost(p.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 text-left transition hover:border-slate-700 hover:bg-slate-900/70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${TAG_CLS[p.tag] || TAG_CLS.carreira}`}>
                        {p.tag}
                      </span>
                      {p.hasRoadmap && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                          <GitBranch className="h-3 w-3" /> roadmap
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-600">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-200">{p.title}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3 font-mono text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {p.score}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {p.commentCount}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-slate-400" />
      <p className="mt-1 font-mono text-lg font-bold text-slate-100">{value}</p>
      <p className="font-mono text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

function SectionLabel({ icon: Icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-emerald-400" />
      <h3 className="font-mono text-sm font-bold text-slate-100">{title}</h3>
    </div>
  )
}
