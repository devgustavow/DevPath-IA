import { X } from 'lucide-react'

/* Modal reutilizável com a estética dark/terminal do app. */
export default function Modal({ title, icon: Icon, onClose, children, maxW = 'max-w-lg' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl animate-fade-in-up`}
      >
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          {Icon && <Icon className="h-4 w-4 text-emerald-400" />}
          <span className="font-mono text-xs text-slate-300">{title}</span>
          <button onClick={onClose} className="ml-auto text-slate-500 transition hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

/* Copia texto e dispara um callback (ex: toast). */
export function copyText(text, onDone) {
  navigator.clipboard?.writeText(text).then(() => onDone?.()).catch(() => onDone?.())
}

/* Faz o download de um conteúdo de texto como arquivo. */
export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
