import { useState } from 'react'
import Modal from '../components/Modal'
import { copyText, downloadText } from '../components/Modal'
import { api } from '../lib/api'
import { FileText, Loader2, Copy, Download, Sparkles, AlertTriangle } from 'lucide-react'

/* ============================================================================
 * Feature 6 — Geração de README de portfólio (projeto 100% concluído).
 * Puxa o contexto do que foi construído e gera um README.md pronto p/ o GitHub.
 * ==========================================================================*/

export default function PortfolioReadmeModal({ project, stack, sprints, onClose, showToast }) {
  const [challenges, setChallenges] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [markdown, setMarkdown] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const { markdown } = await api.portfolioReadme({ project, stack, sprints, challenges: challenges.trim() })
      setMarkdown(markdown)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="README.md · portfólio" icon={FileText} onClose={onClose} maxW="max-w-2xl">
      {!markdown ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-300">
              <Sparkles className="h-4 w-4" /> Projeto concluído! 🎉
            </p>
            <p className="mt-1 text-sm text-slate-400">
              A IA vai gerar um README espetacular de <span className="font-mono text-slate-200">{project}</span> com
              tudo que você construiu, pronto pro seu GitHub.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate-500">
              maiores desafios técnicos (opcional)
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="Ex: 'sincronizar o board em tempo real sem race conditions', 'modelar permissões multi-tenant'..."
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 font-mono text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'escrevendo seu README...' : 'Gerar README.md'}
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <button
              onClick={() => copyText(markdown, () => showToast?.('README copiado ✓', 'success'))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 transition hover:border-slate-600"
            >
              <Copy className="h-3.5 w-3.5" /> copiar
            </button>
            <button
              onClick={() => downloadText('README.md', markdown, 'text/markdown')}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 font-mono text-xs font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
            >
              <Download className="h-3.5 w-3.5" /> baixar README.md
            </button>
            <button
              onClick={() => setMarkdown('')}
              className="ml-auto rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-400 transition hover:text-slate-200"
            >
              refazer
            </button>
          </div>
          <pre className="max-h-[50vh] overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
            {markdown}
          </pre>
        </div>
      )}
    </Modal>
  )
}
