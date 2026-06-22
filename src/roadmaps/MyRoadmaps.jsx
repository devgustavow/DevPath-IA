import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import {
  Loader2,
  GitBranch,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Cpu,
  Trash2,
  ArrowRight,
  FolderGit2,
  LogIn,
  CheckCircle2,
} from 'lucide-react'

/* ============================================================================
 * "Meus roadmaps": lista os roadmaps salvos do usuário para ele continuar de
 * onde parou. Cada card mostra progresso, origem (IA/exemplo) e meta.
 * ==========================================================================*/

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export default function MyRoadmaps({ user, onSelect, onRequireAuth, showToast, reloadKey }) {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { roadmaps } = await api.listRoadmaps()
      setRoadmaps(roadmaps)
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setLoading(false)
    }
  }, [user, showToast])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const remove = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Excluir este roadmap? Essa ação não pode ser desfeita.')) return
    setDeletingId(id)
    try {
      await api.deleteRoadmap(id)
      setRoadmaps((list) => list.filter((r) => r.id !== id))
      showToast?.('Roadmap excluído.', 'info')
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setDeletingId(null)
    }
  }

  // Não logado → convite para entrar.
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/40 p-10 text-center animate-fade-in">
        <FolderGit2 className="mx-auto h-9 w-9 text-slate-600" />
        <h3 className="mt-3 font-mono text-lg font-bold text-slate-200">Seus roadmaps ficam salvos aqui</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Entre para salvar os roadmaps que você gerar e continuar de onde parou, em qualquer dispositivo.
        </p>
        <button
          onClick={onRequireAuth}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
        >
          <LogIn className="h-4 w-4" /> Entrar / Criar conta
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 font-mono text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> carregando seus roadmaps...
      </div>
    )
  }

  if (roadmaps.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center animate-fade-in">
        <FolderGit2 className="mx-auto h-9 w-9 text-slate-600" />
        <h3 className="mt-3 font-mono text-lg font-bold text-slate-200">Nenhum roadmap ainda</h3>
        <p className="mt-2 text-sm text-slate-400">
          Vá em <span className="font-mono text-emerald-300">Criar novo</span> e gere seu primeiro roadmap — ele
          aparecerá aqui automaticamente.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3 animate-fade-in">
      <p className="font-mono text-xs text-slate-500">
        {roadmaps.length} roadmap{roadmaps.length > 1 ? 's' : ''} salvo{roadmaps.length > 1 ? 's' : ''} · clique para
        continuar
      </p>
      {roadmaps.map((r) => (
        <button
          key={r.id}
          onClick={() => onSelect(r.id)}
          className="group flex w-full items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-emerald-500/40 hover:bg-slate-900/70"
        >
          <span
            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border ${
              r.progress === 100
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                : 'border-slate-700 bg-slate-950/60 text-emerald-400'
            }`}
          >
            {r.progress === 100 ? <CheckCircle2 className="h-5 w-5" /> : <GitBranch className="h-5 w-5" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-mono text-sm font-bold text-slate-100">{r.project}</h3>
              <span
                className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                  r.source === 'ai'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400'
                }`}
              >
                {r.source === 'ai' ? <Sparkles className="h-2.5 w-2.5" /> : <Cpu className="h-2.5 w-2.5" />}
                {r.source === 'ai' ? 'IA' : 'exemplo'}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" /> {r.sprintsCount} sprints
              </span>
              {r.weeks != null && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {r.weeks} sem
                </span>
              )}
              {r.totalEffort != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {r.totalEffort}h
                </span>
              )}
              <span>· atualizado {timeAgo(r.updatedAt)}</span>
            </div>

            {/* Barra de progresso */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                  style={{ width: `${r.progress}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {r.doneTasks}/{r.totalTasks} · {r.progress}%
              </span>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <span
              onClick={(e) => remove(e, r.id)}
              role="button"
              title="Excluir"
              className="rounded-lg p-2 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
            >
              {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
          </div>
        </button>
      ))}
    </div>
  )
}
