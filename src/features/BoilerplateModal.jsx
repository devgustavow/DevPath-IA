import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import Modal from '../components/Modal'
import { copyText, downloadText } from '../components/Modal'
import { api } from '../lib/api'
import { FolderTree, Loader2, Copy, Download, FileArchive, Terminal, Folder, FileCode, AlertTriangle } from 'lucide-react'

/* ============================================================================
 * Feature 2 — Geração de boilerplate + árvore de pastas.
 * A IA devolve um script bash e a lista de arquivos/pastas; o usuário pode
 * copiar o script, baixar setup.sh ou baixar um .zip com a estrutura.
 * ==========================================================================*/

export default function BoilerplateModal({ project, stack, features, onClose, showToast }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null) // { script, tree, notes }

  useEffect(() => {
    let alive = true
    api
      .boilerplate({ project, stack, features })
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [project, stack, features])

  const slug = (project || 'projeto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const downloadZip = async () => {
    const zip = new JSZip()
    const root = zip.folder(slug)
    for (const item of data.tree) {
      const path = String(item.path || '').replace(/^\/+/, '')
      if (!path) continue
      if (path.endsWith('/')) root.folder(path)
      else root.file(path, item.content || '')
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.zip`
    a.click()
    URL.revokeObjectURL(url)
    showToast?.('Estrutura baixada (.zip) ✓', 'success')
  }

  return (
    <Modal title="boilerplate · estrutura inicial" icon={FolderTree} onClose={onClose} maxW="max-w-2xl">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 font-mono text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> a IA está desenhando a arquitetura...
        </div>
      ) : error ? (
        <p className="flex items-center gap-2 py-6 font-mono text-sm text-red-400">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      ) : (
        <div className="space-y-4">
          {data.notes && <p className="text-sm text-slate-400">💡 {data.notes}</p>}

          {/* Árvore */}
          <div>
            <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">árvore de pastas</p>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs">
              {data.tree.map((item, i) => {
                const path = String(item.path || '')
                const isDir = path.endsWith('/')
                const depth = (path.match(/\//g) || []).length - (isDir ? 1 : 0)
                return (
                  <div key={i} className="flex items-center gap-1.5 py-0.5 text-slate-300" style={{ paddingLeft: `${depth * 14}px` }}>
                    {isDir ? <Folder className="h-3.5 w-3.5 text-blue-400" /> : <FileCode className="h-3.5 w-3.5 text-slate-500" />}
                    <span className={isDir ? 'text-blue-300' : ''}>{path.replace(/\/$/, '').split('/').pop() || path}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Script */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">
              <Terminal className="h-3.5 w-3.5" /> script de terminal
            </p>
            <pre className="max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs leading-relaxed text-emerald-300">
              {data.script}
            </pre>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copyText(data.script, () => showToast?.('Script copiado ✓', 'success'))}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 transition hover:border-slate-600"
            >
              <Copy className="h-3.5 w-3.5" /> copiar script
            </button>
            <button
              onClick={() => downloadText('setup.sh', data.script, 'text/x-shellscript')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs text-slate-300 transition hover:border-slate-600"
            >
              <Download className="h-3.5 w-3.5" /> setup.sh
            </button>
            <button
              onClick={downloadZip}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 font-mono text-xs font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
            >
              <FileArchive className="h-3.5 w-3.5" /> baixar .zip
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
