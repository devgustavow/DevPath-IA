import { useState } from 'react'
import { api } from '../lib/api'
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, ThumbsUp, ChevronDown, Sparkles } from 'lucide-react'

/* ============================================================================
 * Feature 3 — Validador de Sprint (micro code review).
 * O dev cola o código que escreveu; a IA age como um sênior revisando o PR.
 * ==========================================================================*/

const VERDICTS = {
  aprovado: { label: 'Aprovado', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', icon: CheckCircle2 },
  ajustes: { label: 'Bom, com ajustes', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300', icon: AlertTriangle },
  refazer: { label: 'Precisa refazer', cls: 'border-red-500/40 bg-red-500/10 text-red-300', icon: AlertTriangle },
}
const SEV = { alta: 'text-red-400', media: 'text-amber-400', baixa: 'text-blue-400' }

export default function SprintValidator({ sprintTitle, stack }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)

  const submit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setReview(null)
    try {
      setReview(await api.reviewCode({ code, sprintTitle, stack }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verdict = review && (VERDICTS[review.verdict] || VERDICTS.ajustes)

  return (
    <div className="mx-1 mt-1 rounded-lg border border-slate-800 bg-slate-950/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
        Validar sprint (code review da IA)
        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-800/80 p-3 animate-fade-in">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Cole aqui o trecho principal do código que você escreveu neste sprint..."
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950/80 p-3 font-mono text-xs text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={submit}
            disabled={loading || !code.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 font-mono text-xs font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'revisando...' : 'Pedir review ao sênior'}
          </button>

          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          {review && (
            <div className="space-y-3 animate-fade-in">
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${verdict.cls}`}>
                <verdict.icon className="h-4 w-4" />
                <span className="font-mono text-xs font-bold">{verdict.label}</span>
              </div>
              <p className="text-xs text-slate-300">{review.summary}</p>

              {review.positives?.length > 0 && (
                <div>
                  {review.positives.map((p, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                      <ThumbsUp className="mt-0.5 h-3 w-3 flex-shrink-0 text-emerald-400" /> {p}
                    </p>
                  ))}
                </div>
              )}

              {review.issues?.length > 0 && (
                <div className="space-y-2">
                  {review.issues.map((iss, i) => (
                    <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <AlertTriangle className={`h-3.5 w-3.5 ${SEV[iss.severity] || 'text-slate-400'}`} />
                        {iss.title}
                        <span className={`ml-auto font-mono text-[10px] uppercase ${SEV[iss.severity] || 'text-slate-500'}`}>
                          {iss.severity}
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{iss.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
