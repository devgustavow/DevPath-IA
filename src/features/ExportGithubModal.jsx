import { useState } from 'react'
import Modal from '../components/Modal'
import { api } from '../lib/api'
import { Github, Loader2, KeyRound, FolderGit2, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react'

/* ============================================================================
 * Feature 1 — Exportar para GitHub Issues.
 * O usuário informa owner/repo + um PAT; o backend cria uma milestone por
 * sprint e uma issue por tarefa (com a Definition of Done no corpo).
 * O token é usado só na requisição — nunca é salvo.
 * ==========================================================================*/

export default function ExportGithubModal({ project, sprints, defaultOwner, onClose, showToast }) {
  const [owner, setOwner] = useState(defaultOwner || '')
  const [repo, setRepo] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const totalTasks = sprints.reduce((acc, s) => acc + (s.tasks?.length || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.exportGithubIssues({ token: token.trim(), owner: owner.trim(), repo: repo.trim(), project, sprints })
      setResult(res)
      showToast?.(`${res.issuesCreated} issues criadas no GitHub ✓`, 'success')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="export/github-issues" icon={Github} onClose={onClose}>
      {result ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <h3 className="mt-3 font-mono text-lg font-bold text-slate-100">Exportado! 🎉</h3>
          <p className="mt-1 text-sm text-slate-400">
            Criamos <span className="font-mono text-emerald-300">{result.issuesCreated} issues</span> e{' '}
            <span className="font-mono text-emerald-300">{result.milestonesCreated} milestones</span> no seu repositório.
          </p>
          {result.errors?.length > 0 && (
            <p className="mt-2 font-mono text-[11px] text-amber-400">{result.errors.length} item(ns) falharam.</p>
          )}
          <a
            href={result.issuesUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
          >
            ver issues no GitHub <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-400">
            Vamos criar <span className="font-mono text-emerald-300">{totalTasks} issues</span> (uma por tarefa) e{' '}
            <span className="font-mono text-emerald-300">{sprints.length} milestones</span> (uma por sprint) no seu repo.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Field icon={Github} placeholder="owner (usuário/org)" value={owner} onChange={setOwner} />
            <Field icon={FolderGit2} placeholder="repositório" value={repo} onChange={setRepo} />
          </div>
          <Field icon={KeyRound} type="password" placeholder="Personal Access Token (repo)" value={token} onChange={setToken} />

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <p className="font-mono text-[11px] leading-relaxed text-slate-400">
              O token é usado só nesta requisição e <strong>não é salvo</strong>. Crie um com escopo <code>repo</code> (ou
              fine-grained com permissão de Issues) em{' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline"
              >
                github.com/settings/tokens
              </a>
              .
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 font-mono text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !owner.trim() || !repo.trim() || !token.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? 'criando issues no GitHub...' : 'Exportar agora'}
          </button>
          {loading && <p className="text-center font-mono text-[11px] text-slate-500">Pode levar alguns segundos (rate-limit do GitHub).</p>}
        </form>
      )}
    </Modal>
  )
}

function Field({ icon: Icon, type = 'text', placeholder, value, onChange }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  )
}
