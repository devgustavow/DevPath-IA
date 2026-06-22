import express from 'express'
import { readDB, writeDB } from './db.js'
import { requireAuth, publicUser } from './auth.js'
import { touchStreak, currentStreak } from './streak.js'

/* ============================================================================
 * Rotas do PERFIL do usuário: dashboard, progressão (streak), projeto atual
 * e notificações.
 * ==========================================================================*/

const router = express.Router()

function findUser(req) {
  const db = readDB()
  const user = db.users.find((u) => u.id === req.userId)
  return { db, user }
}

// POST /api/me/activity — registra atividade e atualiza a ofensiva/defensiva.
router.post('/me/activity', requireAuth, (req, res) => {
  const { db, user } = findUser(req)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  const result = touchStreak(user)
  writeDB(db)
  res.json({ streak: currentStreak(user), ...result })
})

// PUT /api/me/project — salva o projeto/roadmap em que o usuário está trabalhando.
router.put('/me/project', requireAuth, (req, res) => {
  const { db, user } = findUser(req)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  user.currentProject = { ...req.body, updatedAt: new Date().toISOString() }
  writeDB(db)
  res.json({ ok: true })
})

// GET /api/me/dashboard — tudo que a dashboard do perfil precisa.
router.get('/me/dashboard', requireAuth, (req, res) => {
  const { db, user } = findUser(req)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  const myPosts = db.posts.filter((p) => p.authorId === user.id)
  const myComments = db.comments.filter((c) => c.authorId === user.id)
  const myPostIds = new Set(myPosts.map((p) => p.id))
  const myCommentIds = new Set(myComments.map((c) => c.id))

  // Karma = soma dos votos recebidos nos posts e comentários do usuário.
  const karma = db.votes
    .filter(
      (v) =>
        (v.targetType === 'post' && myPostIds.has(v.targetId)) ||
        (v.targetType === 'comment' && myCommentIds.has(v.targetId)),
    )
    .reduce((acc, v) => acc + v.value, 0)

  const posts = myPosts
    .map((p) => ({
      id: p.id,
      title: p.title,
      tag: p.tag,
      createdAt: p.createdAt,
      hasRoadmap: Boolean(p.roadmap),
      score: db.votes.filter((v) => v.targetType === 'post' && v.targetId === p.id).reduce((a, v) => a + v.value, 0),
      commentCount: db.comments.filter((c) => c.postId === p.id).length,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json({
    user: publicUser(user),
    streak: currentStreak(user),
    currentProject: user.currentProject || null,
    stats: { posts: myPosts.length, comments: myComments.length, karma },
    posts,
  })
})

// GET /api/notifications — lista as notificações do usuário (+ não lidas).
router.get('/notifications', requireAuth, (req, res) => {
  const db = readDB()
  const list = (db.notifications || [])
    .filter((n) => n.userId === req.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 40)
  res.json({ notifications: list, unread: list.filter((n) => !n.read).length })
})

// POST /api/notifications/read — marca todas como lidas.
router.post('/notifications/read', requireAuth, (req, res) => {
  const db = readDB()
  ;(db.notifications || []).forEach((n) => {
    if (n.userId === req.userId) n.read = true
  })
  writeDB(db)
  res.json({ ok: true })
})

export default router
