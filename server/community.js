import express from 'express'
import { readDB, writeDB, uid, addNotification } from './db.js'
import { requireAuth, softUserId } from './auth.js'
import { touchStreak } from './streak.js'

/* ============================================================================
 * Fórum estilo Reddit: posts + comentários + votos (up/down) com ranking.
 * Um post pode carregar um "roadmap" anexado (compartilhar progresso).
 * ==========================================================================*/

const router = express.Router()

export const POST_TAGS = ['carreira', 'duvida', 'showoff', 'roadmap', 'recurso', 'vaga']

// ---- Helpers de agregação -------------------------------------------------

function scoreOf(db, targetType, targetId) {
  return db.votes
    .filter((v) => v.targetType === targetType && v.targetId === targetId)
    .reduce((acc, v) => acc + v.value, 0)
}

function myVote(db, targetType, targetId, userId) {
  if (!userId) return 0
  const v = db.votes.find((x) => x.targetType === targetType && x.targetId === targetId && x.userId === userId)
  return v ? v.value : 0
}

function authorOf(db, userId) {
  const u = db.users.find((x) => x.id === userId)
  return u
    ? { id: u.id, username: u.username, avatarColor: u.avatarColor }
    : { id: null, username: 'desconhecido', avatarColor: '#64748b' }
}

function enrichPost(db, p, userId, { withComments = false } = {}) {
  const comments = db.comments.filter((c) => c.postId === p.id)
  const out = {
    id: p.id,
    title: p.title,
    body: p.body,
    tag: p.tag,
    roadmap: p.roadmap || null,
    author: authorOf(db, p.authorId),
    createdAt: p.createdAt,
    score: scoreOf(db, 'post', p.id),
    userVote: myVote(db, 'post', p.id, userId),
    commentCount: comments.length,
  }
  if (withComments) {
    out.comments = comments
      .map((c) => ({
        id: c.id,
        body: c.body,
        author: authorOf(db, c.authorId),
        createdAt: c.createdAt,
        score: scoreOf(db, 'comment', c.id),
        userVote: myVote(db, 'comment', c.id, userId),
      }))
      .sort((a, b) => b.score - a.score || new Date(a.createdAt) - new Date(b.createdAt))
  }
  return out
}

// "Hot": pondera votos pela idade do post (decai com o tempo).
function hotRank(post) {
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3600000
  return post.score / Math.pow(ageHours + 2, 1.4)
}

// Grava/atualiza/remove o voto de um usuário (value: 1, -1 ou 0 p/ remover).
function setVote(db, targetType, targetId, userId, rawValue) {
  const value = rawValue > 0 ? 1 : rawValue < 0 ? -1 : 0
  const idx = db.votes.findIndex(
    (v) => v.targetType === targetType && v.targetId === targetId && v.userId === userId,
  )
  if (value === 0) {
    if (idx >= 0) db.votes.splice(idx, 1)
  } else if (idx >= 0) {
    db.votes[idx].value = value
  } else {
    db.votes.push({ id: uid('vote'), targetType, targetId, userId, value })
  }
}

// ---- Rotas ----------------------------------------------------------------

// GET /api/posts?sort=hot|new|top
router.get('/posts', (req, res) => {
  const userId = softUserId(req)
  const sort = String(req.query.sort || 'hot')
  const db = readDB()

  let posts = db.posts.map((p) => enrichPost(db, p, userId))
  if (sort === 'new') {
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sort === 'top') {
    posts.sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt))
  } else {
    posts.sort((a, b) => hotRank(b) - hotRank(a))
  }
  res.json({ posts, tags: POST_TAGS })
})

// GET /api/posts/:id  (com comentários)
router.get('/posts/:id', (req, res) => {
  const userId = softUserId(req)
  const db = readDB()
  const post = db.posts.find((p) => p.id === req.params.id)
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' })
  res.json({ post: enrichPost(db, post, userId, { withComments: true }) })
})

// POST /api/posts  (criar post — precisa login)
router.post('/posts', requireAuth, (req, res) => {
  const title = String(req.body?.title || '').trim()
  const body = String(req.body?.body || '').trim()
  const tag = POST_TAGS.includes(req.body?.tag) ? req.body.tag : 'carreira'
  const roadmap = req.body?.roadmap || null

  if (title.length < 4) return res.status(400).json({ error: 'O título precisa de ao menos 4 caracteres.' })

  const db = readDB()
  const post = {
    id: uid('post'),
    authorId: req.userId,
    title,
    body,
    tag,
    roadmap, // snapshot opcional do roadmap compartilhado
    createdAt: new Date().toISOString(),
  }
  db.posts.push(post)

  // Publicar conta como atividade (alimenta a ofensiva).
  const author = db.users.find((u) => u.id === req.userId)
  if (author) touchStreak(author)

  writeDB(db)
  res.status(201).json({ post: enrichPost(db, post, req.userId, { withComments: true }) })
})

// POST /api/posts/:id/comments  (comentar — precisa login)
router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const body = String(req.body?.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Escreva algo no comentário.' })

  const db = readDB()
  const post = db.posts.find((p) => p.id === req.params.id)
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' })

  const comment = {
    id: uid('comment'),
    postId: post.id,
    authorId: req.userId,
    body,
    createdAt: new Date().toISOString(),
  }
  db.comments.push(comment)

  // Comentar conta como atividade.
  const commenter = db.users.find((u) => u.id === req.userId)
  if (commenter) touchStreak(commenter)

  // Notifica o autor do post (se não for ele mesmo comentando).
  if (post.authorId !== req.userId) {
    addNotification(db, {
      userId: post.authorId,
      type: 'comment',
      actor: commenter?.username || 'alguém',
      postId: post.id,
      postTitle: post.title,
      text: `${commenter?.username || 'alguém'} comentou no seu post`,
    })
  }

  writeDB(db)
  res.status(201).json({ post: enrichPost(db, post, req.userId, { withComments: true }) })
})

// POST /api/posts/:id/vote  { value: 1 | -1 | 0 }
router.post('/posts/:id/vote', requireAuth, (req, res) => {
  const db = readDB()
  const post = db.posts.find((p) => p.id === req.params.id)
  if (!post) return res.status(404).json({ error: 'Post não encontrado.' })
  const value = Number(req.body?.value) || 0
  setVote(db, 'post', post.id, req.userId, value)

  // Notifica o autor quando recebe um upvote (e não é ele mesmo).
  if (value === 1 && post.authorId !== req.userId) {
    const voter = db.users.find((u) => u.id === req.userId)
    addNotification(db, {
      userId: post.authorId,
      type: 'vote',
      actor: voter?.username || 'alguém',
      postId: post.id,
      postTitle: post.title,
      text: `${voter?.username || 'alguém'} votou no seu post`,
    })
  }

  writeDB(db)
  res.json({ score: scoreOf(db, 'post', post.id), userVote: myVote(db, 'post', post.id, req.userId) })
})

// POST /api/comments/:id/vote  { value: 1 | -1 | 0 }
router.post('/comments/:id/vote', requireAuth, (req, res) => {
  const db = readDB()
  const comment = db.comments.find((c) => c.id === req.params.id)
  if (!comment) return res.status(404).json({ error: 'Comentário não encontrado.' })
  setVote(db, 'comment', comment.id, req.userId, Number(req.body?.value) || 0)
  writeDB(db)
  res.json({ score: scoreOf(db, 'comment', comment.id), userVote: myVote(db, 'comment', comment.id, req.userId) })
})

export default router
