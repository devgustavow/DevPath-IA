import { useState } from 'react'
import { api } from '../lib/api'
import { SlidersHorizontal, Loader2, Sparkles, Check, Star, RotateCcw, Plus } from 'lucide-react'

/* ============================================================================
 * Feature 5 — Seleção dinâmica de escopo.
 * A IA sugere features opcionais (checkboxes). O que o dev marcar entra em
 * form.features e influencia o roadmap (mais features = mais semanas).
 * ==========================================================================*/

export default function ScopeSelector({ form, setForm, showToast }) {
  const [loading, setLoading] = useState(false)
  const [suggested, setSuggested] = useState([]) // {label, description, weeks, recommended}

  const suggest = async () => {
    if (!form.project.trim()) {
      showToast?.('Digite o projeto primeiro.', 'info')
      return
    }
    setLoading(true)
    try {
      const { features } = await api.suggestFeatures({ project: form.project, stack: form.stack, level: form.level })
      setSuggested(features)
      // Pré-marca as recomendadas (MVP saudável).
      setForm((f) => ({ ...f, features: features.filter((x) => x.recommended).map((x) => x.label) }))
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (label) =>
    setForm((f) => ({
      ...f,
      features: f.features.includes(label) ? f.features.filter((l) => l !== label) : [...f.features, label],
    }))

  const extraWeeks = suggested
    .filter((x) => form.features.includes(x.label))
    .reduce((acc, x) => acc + (Number(x.weeks) || 0), 0)

  // Estado inicial: botão para sugerir.
  if (suggested.length === 0) {
    return (
      <button
        type="button"
        onClick={suggest}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 py-3 font-mono text-sm font-semibold text-violet-200 transition hover:bg-violet-500/10 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
        {loading ? 'A IA está montando o escopo...' : 'Sugerir escopo com IA (features opcionais)'}
      </button>
    )
  }

  // Lista de checkboxes.
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-violet-300">
          <Sparkles className="h-3.5 w-3.5" /> marque o que você quer construir
        </span>
        <button
          type="button"
          onClick={suggest}
          disabled={loading}
          className="flex items-center gap-1 font-mono text-[11px] text-slate-500 transition hover:text-slate-300"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} refazer
        </button>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {suggested.map((feat) => {
          const active = form.features.includes(feat.label)
          return (
            <button
              type="button"
              key={feat.label}
              onClick={() => toggle(feat.label)}
              className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition ${
                active ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
              }`}
            >
              <span
                className={`mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded border ${
                  active ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-600'
                }`}
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                  {feat.label}
                  {feat.recommended && <Star className="h-3 w-3 text-amber-400" fill="currentColor" />}
                </span>
                <span className="block text-[11px] leading-snug text-slate-500">{feat.description}</span>
                <span className="font-mono text-[10px] text-violet-300/80">+{feat.weeks} sem</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Plus className="h-3 w-3" /> {form.features.length} features selecionadas
        </span>
        <span className="text-violet-300">~+{extraWeeks.toFixed(1)} semanas de escopo</span>
      </div>
    </div>
  )
}
