import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../lib/api'
import { Bell, MessageSquare, ArrowBigUp, Flame, Loader2 } from 'lucide-react'

/* ============================================================================
 * Sino de notificações do header. Mostra um badge com o número de não lidas,
 * abre um dropdown com a lista e marca como lidas ao abrir.
 * ==========================================================================*/

const ICONS = { comment: MessageSquare, vote: ArrowBigUp, streak: Flame }

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async () => {
    try {
      const { notifications, unread } = await api.notifications()
      setItems(notifications)
      setUnread(unread)
    } catch {
      /* silencioso */
    }
  }, [])

  // Carrega ao montar e a cada 45s (sem websockets, mantém leve).
  useEffect(() => {
    load()
    const t = setInterval(load, 45000)
    return () => clearInterval(t)
  }, [load])

  // Fecha ao clicar fora.
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      await load()
      setLoading(false)
      if (unread > 0) {
        api.readNotifications().then(() => setUnread(0)).catch(() => {})
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative grid h-8 w-8 place-items-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-emerald-500 px-1 font-mono text-[10px] font-bold text-slate-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
            <span className="font-mono text-xs font-bold text-slate-200">Notificações</span>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-slate-700" />
                <p className="mt-2 font-mono text-xs text-slate-600">nenhuma notificação ainda</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] || Bell
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 border-b border-slate-800/60 px-4 py-3 ${
                      n.read ? '' : 'bg-emerald-500/[0.04]'
                    }`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300">{n.text}</p>
                      {n.postTitle && <p className="truncate font-mono text-[11px] text-slate-500">“{n.postTitle}”</p>}
                      <p className="font-mono text-[10px] text-slate-600">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
