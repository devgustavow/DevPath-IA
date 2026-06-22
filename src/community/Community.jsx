import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import {
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  Plus,
  Loader2,
  X,
  Flame,
  Clock,
  TrendingUp,
  Send,
  ChevronLeft,
  Calendar,
  Layers,
  GitBranch,
  Sparkles,
  LogIn,
} from 'lucide-react'

/* ============================================================================
 * Área de comunidade (estilo Reddit): feed de posts, votos, comentários e
 * compartilhamento de roadmap. Toda ação que exige login chama onRequireAuth.
 * ==========================================================================*/

const TAG_META = {
  carreira: { label: 'carreira', cls: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  duvida: { label: 'dúvida', cls: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  showoff: { label: 'showoff', cls: 'text-pink-300 border-pink-500/30 bg-pink-500/10' },
  roadmap: { label: 'roadmap', cls: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' },
  recurso: { label: 'recurso', cls: 'text-violet-300 border-violet-500/30 bg-violet-500/10' },
  vaga: { label: 'vaga', cls: 'text-teal-300 border-teal-500/30 bg-teal-500/10' },
}
const TAGS = Object.keys(TAG_META)

const SORTS = [
  { id: 'hot', label: 'Quentes', icon: Flame },
  { id: 'new', label: 'Novos', icon: Clock },
  { id: 'top', label: 'Top', icon: TrendingUp },
]

// "há 3h", "há 2d", "agora"
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

export default function Community({ onRequireAuth, pendingShare, onConsumeShare, showToast }) {
  const { user } = useAuth()
  const [view, setView] = useState('list') // 'list' | 'detail'
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('hot')
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { posts } = await api.listPosts(sort)
      setPosts(posts)
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setLoading(false)
    }
  }, [sort, showToast])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Se chegou um roadmap para compartilhar, abre o modal de criação.
  useEffect(() => {
    if (pendingShare) {
      setView('list')
      setCreateOpen(true)
    }
  }, [pendingShare])

  // Voto otimista (atualiza a UI antes da resposta; reverte em erro).
  const handleVotePost = async (post, value) => {
    if (!user) return onRequireAuth()
    const prev = { score: post.score, userVote: post.userVote }
    const delta = value - post.userVote
    patchPost(post.id, { score: post.score + delta, userVote: value })
    try {
      await api.votePost(post.id, value)
    } catch (err) {
      patchPost(post.id, prev)
      showToast?.(err.message, 'info')
    }
  }

  const patchPost = (id, patch) => {
    setPosts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d))
  }

  const openDetail = async (id) => {
    setView('detail')
    setLoadingDetail(true)
    try {
      const { post } = await api.getPost(id)
      setDetail(post)
    } catch (err) {
      showToast?.(err.message, 'info')
      setView('list')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCreated = (post) => {
    setCreateOpen(false)
    onConsumeShare?.()
    showToast?.('Post publicado na comunidade ✓', 'success')
    refresh()
    openDetail(post.id)
  }

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho da seção */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <MessageSquare className="h-3.5 w-3.5" />
            r/devpath
          </span>
          <h2 className="mt-1 font-mono text-2xl font-extrabold tracking-tight text-slate-100">Comunidade</h2>
          <p className="mt-1 text-sm text-slate-500">Saia do Tutorial Hell acompanhado. Compartilhe, vote e ajude.</p>
        </div>
        <button
          onClick={() => (user ? setCreateOpen(true) : onRequireAuth())}
          className="flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 font-mono text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400"
        >
          <Plus className="h-4 w-4" />
          Novo post
        </button>
      </div>

      {view === 'detail' ? (
        <PostDetail
          post={detail}
          loading={loadingDetail}
          user={user}
          onBack={() => setView('list')}
          onRequireAuth={onRequireAuth}
          onVotePost={handleVotePost}
          onUpdate={setDetail}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Abas de ordenação */}
          <div className="mb-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-900/40 p-1">
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition ${
                  sort === s.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 font-mono text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> carregando feed...
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onOpen={() => openDetail(p.id)} onVote={handleVotePost} />
              ))}
            </div>
          )}
        </>
      )}

      {createOpen && (
        <CreatePostModal
          user={user}
          share={pendingShare}
          onClose={() => {
            setCreateOpen(false)
            onConsumeShare?.()
          }}
          onRequireAuth={onRequireAuth}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

/* ----- Voto (setas up/down + score) -------------------------------------- */
function VoteControl({ score, userVote, onVote, vertical = true }) {
  const up = (e) => {
    e.stopPropagation()
    onVote(userVote === 1 ? 0 : 1)
  }
  const down = (e) => {
    e.stopPropagation()
    onVote(userVote === -1 ? 0 : -1)
  }
  return (
    <div className={`flex items-center ${vertical ? 'flex-col' : 'flex-row'} gap-0.5`}>
      <button onClick={up} className={`rounded p-0.5 transition hover:bg-slate-700/50 ${userVote === 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
        <ArrowBigUp className="h-5 w-5" fill={userVote === 1 ? 'currentColor' : 'none'} />
      </button>
      <span
        className={`font-mono text-xs font-bold tabular-nums ${
          userVote === 1 ? 'text-emerald-400' : userVote === -1 ? 'text-blue-400' : 'text-slate-300'
        }`}
      >
        {score}
      </span>
      <button onClick={down} className={`rounded p-0.5 transition hover:bg-slate-700/50 ${userVote === -1 ? 'text-blue-400' : 'text-slate-500'}`}>
        <ArrowBigDown className="h-5 w-5" fill={userVote === -1 ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

function Avatar({ username, color, size = 'h-6 w-6' }) {
  return (
    <span
      className={`grid ${size} flex-shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold text-slate-950`}
      style={{ backgroundColor: color }}
    >
      {String(username || '?').charAt(0).toUpperCase()}
    </span>
  )
}

function TagBadge({ tag }) {
  const meta = TAG_META[tag] || TAG_META.carreira
  return <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${meta.cls}`}>{meta.label}</span>
}

/* ----- Card do post no feed ---------------------------------------------- */
function PostCard({ post, onOpen, onVote }) {
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/70"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <VoteControl score={post.score} userVote={post.userVote} onVote={(v) => onVote(post, v)} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
          <TagBadge tag={post.tag} />
          <Avatar username={post.author.username} color={post.author.avatarColor} size="h-4 w-4" />
          <span className="text-slate-400">{post.author.username}</span>
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>

        <h3 className="mt-1.5 font-semibold text-slate-100">{post.title}</h3>
        {post.body && <p className="mt-1 line-clamp-2 text-sm text-slate-400">{post.body}</p>}

        {post.roadmap && <RoadmapAttachment roadmap={post.roadmap} compact />}

        <div className="mt-2.5 flex items-center gap-1.5 font-mono text-xs text-slate-500">
          <MessageSquare className="h-3.5 w-3.5" />
          {post.commentCount} comentário{post.commentCount === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  )
}

/* ----- Roadmap anexado ao post ------------------------------------------- */
function RoadmapAttachment({ roadmap, compact = false }) {
  const sprints = roadmap.sprints || []
  const shown = compact ? sprints.slice(0, 4) : sprints
  return (
    <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-3">
      <div className="flex items-center gap-2 font-mono text-xs text-emerald-300">
        <GitBranch className="h-3.5 w-3.5" />
        roadmap: {roadmap.project}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500">
        {roadmap.weeks != null && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {roadmap.weeks} semanas
          </span>
        )}
        {roadmap.totalEffort != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {roadmap.totalEffort}h
          </span>
        )}
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3" />
          {sprints.length} sprints
        </span>
      </div>
      <ol className="mt-2 space-y-1">
        {shown.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
            <span className="font-mono text-emerald-500">{i + 1}.</span>
            <span className="truncate">{s.title}</span>
          </li>
        ))}
        {compact && sprints.length > shown.length && (
          <li className="font-mono text-[11px] text-slate-600">+{sprints.length - shown.length} sprints...</li>
        )}
      </ol>
    </div>
  )
}

/* ----- Detalhe do post (com comentários) --------------------------------- */
function PostDetail({ post, loading, user, onBack, onRequireAuth, onVotePost, onUpdate, showToast }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  if (loading || !post) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 font-mono text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> abrindo post...
      </div>
    )
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!user) return onRequireAuth()
    if (!text.trim()) return
    setSending(true)
    try {
      const { post: updated } = await api.addComment(post.id, text.trim())
      onUpdate(updated)
      setText('')
    } catch (err) {
      showToast?.(err.message, 'info')
    } finally {
      setSending(false)
    }
  }

  const voteComment = async (comment, value) => {
    if (!user) return onRequireAuth()
    const delta = value - comment.userVote
    onUpdate({
      ...post,
      comments: post.comments.map((c) => (c.id === comment.id ? { ...c, score: c.score + delta, userVote: value } : c)),
    })
    try {
      await api.voteComment(comment.id, value)
    } catch (err) {
      showToast?.(err.message, 'info')
    }
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 font-mono text-xs text-slate-400 transition hover:text-emerald-400"
      >
        <ChevronLeft className="h-4 w-4" /> voltar ao feed
      </button>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex gap-4">
          <VoteControl score={post.score} userVote={post.userVote} onVote={(v) => onVotePost(post, v)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
              <TagBadge tag={post.tag} />
              <Avatar username={post.author.username} color={post.author.avatarColor} size="h-4 w-4" />
              <span className="text-slate-400">{post.author.username}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-100">{post.title}</h2>
            {post.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{post.body}</p>}
            {post.roadmap && <RoadmapAttachment roadmap={post.roadmap} />}
          </div>
        </div>
      </div>

      {/* Caixa de comentário */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 font-mono text-sm font-bold text-slate-200">
          <MessageSquare className="h-4 w-4 text-emerald-400" />
          {post.comments.length} comentário{post.comments.length === 1 ? '' : 's'}
        </h3>

        {user ? (
          <form onSubmit={submitComment} className="mb-5 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 font-mono text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        ) : (
          <button
            onClick={onRequireAuth}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 py-3 font-mono text-sm text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <LogIn className="h-4 w-4" /> entre para comentar
          </button>
        )}

        <div className="space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-lg border border-slate-800/80 bg-slate-900/30 p-3">
              <VoteControl score={c.score} userVote={c.userVote} onVote={(v) => voteComment(c, v)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <Avatar username={c.author.username} color={c.author.avatarColor} size="h-4 w-4" />
                  <span className="text-slate-400">{c.author.username}</span>
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{c.body}</p>
              </div>
            </div>
          ))}
          {post.comments.length === 0 && (
            <p className="py-6 text-center font-mono text-xs text-slate-600">seja o primeiro a comentar</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ----- Modal de criação de post ------------------------------------------ */
function CreatePostModal({ user, share, onClose, onRequireAuth, onCreated }) {
  const [form, setForm] = useState({
    title: share ? `Meu roadmap: ${share.project}` : '',
    body: share ? 'Geração feita pela IA do DevPath. O que vocês mudariam na ordem dos sprints?' : '',
    tag: share ? 'roadmap' : 'carreira',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return onRequireAuth()
    setLoading(true)
    setError('')
    try {
      const { post } = await api.createPost({ ...form, roadmap: share || null })
      onCreated(post)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl animate-fade-in-up"
      >
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
          <Plus className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs text-slate-400">novo post</span>
          <button onClick={onClose} className="ml-auto text-slate-500 transition hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!user ? (
          <div className="p-8 text-center">
            <LogIn className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="mt-3 text-sm text-slate-300">Você precisa entrar para publicar.</p>
            <button
              onClick={onRequireAuth}
              className="mt-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-mono text-sm font-bold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
            >
              Entrar / Criar conta
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-5">
            {share && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                roadmap "{share.project}" anexado ao post
              </div>
            )}

            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título do post"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Conte mais... (opcional)"
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />

            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">categoria</p>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => {
                  const meta = TAG_META[t]
                  const active = form.tag === t
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, tag: t }))}
                      className={`rounded-md border px-2.5 py-1 font-mono text-xs transition ${
                        active ? meta.cls : 'border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p className="font-mono text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-mono text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
