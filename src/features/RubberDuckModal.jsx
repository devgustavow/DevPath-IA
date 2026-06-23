import { useState } from 'react'
import Modal from '../components/Modal'
import { api } from '../lib/api'
import { Loader2, HelpCircle, Lightbulb, BookOpen, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react'

/* ============================================================================
 * Feature 4 — Pato de Borracha (Rubber Duck AI).
 * Quando o dev trava numa tarefa, a IA NÃO dá a resposta: faz perguntas
 * socráticas, dá pistas e aponta a documentação oficial.
 * ==========================================================================*/

export default function RubberDuckModal({ task, project, stack, onClose }) {
  const [blocker, setBlocker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [help, setHelp] = useState(null)

  const ask = async () => {
    setLoading(true)
    setError('')
    try {
      setHelp(await api.rubberDuck({ task, project, stack, blocker: blocker.trim() }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="🦆 pato de borracha" icon={HelpCircle} onClose={onClose}>
      <p className="text-xs text-slate-500">tarefa</p>
      <p className="mb-4 font-mono text-sm font-semibold text-slate-200">{task}</p>

      {!help ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Conte (opcional) onde você empacou. O pato <strong>não</strong> vai te dar a resposta pronta — ele te guia
            até você mesmo achar. 🧠
          </p>
          <textarea
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            placeholder="Ex: 'minha requisição retorna 401 mesmo enviando o token'..."
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
          />
          {error && (
            <p className="flex items-center gap-1.5 font-mono text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          <button
            onClick={ask}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'o pato está pensando...' : 'Me ajude a destravar'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {help.questions?.length > 0 && (
            <Section icon={HelpCircle} color="text-emerald-400" title="Perguntas para você pensar">
              {help.questions.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="font-mono text-emerald-500">{i + 1}.</span> {q}
                </li>
              ))}
            </Section>
          )}
          {help.hints?.length > 0 && (
            <Section icon={Lightbulb} color="text-amber-400" title="Pistas (sem spoiler)">
              {help.hints.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" /> {h}
                </li>
              ))}
            </Section>
          )}
          {help.docs?.length > 0 && (
            <Section icon={BookOpen} color="text-blue-400" title="Documentação oficial">
              {help.docs.map((d, i) => (
                <li key={i}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-300 transition hover:text-blue-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> {d.label}
                  </a>
                </li>
              ))}
            </Section>
          )}
          <button
            onClick={() => setHelp(null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 py-2 font-mono text-xs text-slate-400 transition hover:text-slate-200"
          >
            ainda travado? perguntar de novo
          </button>
        </div>
      )}
    </Modal>
  )
}

function Section({ icon: Icon, color, title, children }) {
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 font-mono text-xs font-bold ${color}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  )
}
