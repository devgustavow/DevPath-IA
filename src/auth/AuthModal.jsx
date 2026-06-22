import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Terminal, User, Mail, Lock, Loader2, X, LogIn, UserPlus, AlertTriangle } from 'lucide-react'

/* ============================================================================
 * Modal de Login / Cadastro. Compartilha o visual dark/terminal do app.
 * `open`, `onClose` controlam a visibilidade; `onSuccess` dispara após logar.
 * ==========================================================================*/

export default function AuthModal({ open, onClose, onSuccess }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reseta o estado sempre que abre.
  useEffect(() => {
    if (open) {
      setError('')
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user =
        mode === 'login'
          ? await login(form.identifier.trim(), form.password)
          : await register(form.username.trim(), form.email.trim(), form.password)
      onSuccess?.(user)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/50 animate-fade-in-up"
      >
        {/* Barra de janela */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs text-slate-400">
            {mode === 'login' ? 'auth/login' : 'auth/register'}
          </span>
          <button onClick={onClose} className="ml-auto text-slate-500 transition hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Abas */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
            {[
              { id: 'login', label: 'Entrar', icon: LogIn },
              { id: 'register', label: 'Criar conta', icon: UserPlus },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id)
                  setError('')
                }}
                className={`flex items-center justify-center gap-2 rounded-md py-2 font-mono text-sm font-semibold transition ${
                  mode === t.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <FieldInput icon={User} placeholder="nome de usuário" value={form.username} onChange={set('username')} />
            )}
            {mode === 'register' && (
              <FieldInput icon={Mail} type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} />
            )}
            {mode === 'login' && (
              <FieldInput icon={User} placeholder="usuário ou email" value={form.identifier} onChange={set('identifier')} />
            )}
            <FieldInput
              icon={Lock}
              type="password"
              placeholder={mode === 'register' ? 'crie uma senha (mín. 6)' : 'sua senha'}
              value={form.password}
              onChange={set('password')}
            />

            {error && (
              <p className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-4 text-center font-mono text-[11px] text-slate-600">
            {'// '} senha protegida com hash (bcrypt) — sessão via JWT
          </p>
        </div>
      </div>
    </div>
  )
}

function FieldInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        {...props}
        required
        className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  )
}
