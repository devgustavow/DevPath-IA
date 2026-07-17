import express from 'express'
import { readDB, writeDB, uid } from './db.js'
import { requireAuth, publicUser } from './auth.js'
import { touchStreak, currentStreak } from './streak.js'
import { PLANS, planOf, usageView } from './plans.js'

/* ============================================================================
 * Rotas do PERFIL: dashboard, progressão (streak), notificações e a coleção
 * de ROADMAPS do usuário (criar, listar, abrir, atualizar progresso, excluir).
 * ==========================================================================*/

const router = express.Router()

function findUser(req) {
  const db = readDB()
  return { db, user: db.users.find((u) => u.id === req.userId) }
}

const byUpdatedDesc = (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)

// Conta tarefas concluídas para derivar o progresso.
function roadmapStats(r) {
  const tasks = (r.sprints || []).flatMap((s) => s.tasks || [])
  const done = tasks.filter((t) => t.done).length
  return {
    totalTasks: tasks.length,
    doneTasks: done,
    progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  }
}

// Resumo (lista) — não envia os sprints inteiros.
function roadmapSummary(r) {
  return {
    id: r.id,
    project: r.project,
    level: r.level,
    stack: r.stack,
    source: r.source,
    weeks: r.weeks,
    totalEffort: r.totalEffort,
    sprintsCount: (r.sprints || []).length,
    ...roadmapStats(r),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

// POST /api/me/activity — registra atividade e atualiza ofensiva/defensiva.
router.post('/me/activity', requireAuth, (req, res) => {
  const { db, user } = findUser(req)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  const result = touchStreak(user)
  writeDB(db)
  res.json({ streak: currentStreak(user), ...result })
})

// GET /api/me/dashboard — perfil + roadmap mais recente como "trabalhando em".
router.get('/me/dashboard', requireAuth, (req, res) => {
  const { db, user } = findUser(req)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })

  const myPosts = db.posts.filter((p) => p.authorId === user.id)
  const myComments = db.comments.filter((c) => c.authorId === user.id)
  const myPostIds = new Set(myPosts.map((p) => p.id))
  const myCommentIds = new Set(myComments.map((c) => c.id))
  const karma = db.votes
    .filter(
      (v) =>
        (v.targetType === 'post' && myPostIds.has(v.targetId)) ||
        (v.targetType === 'comment' && myCommentIds.has(v.targetId)),
    )
    .reduce((acc, v) => acc + v.value, 0)

  const myRoadmaps = (db.roadmaps || []).filter((r) => r.userId === user.id).sort(byUpdatedDesc)
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
    currentProject: myRoadmaps[0] ? roadmapSummary(myRoadmaps[0]) : null,
    roadmapsCount: myRoadmaps.length,
    plan: planOf(user),
    usage: usageView(db, user),
    stats: { posts: myPosts.length, comments: myComments.length, karma },
    posts,
  })
})

// GET /api/me/roadmaps — lista os roadmaps do usuário.
router.get('/me/roadmaps', requireAuth, (req, res) => {
  const db = readDB()
  const list = (db.roadmaps || []).filter((r) => r.userId === req.userId).sort(byUpdatedDesc).map(roadmapSummary)
  res.json({ roadmaps: list })
})

// GET /api/me/roadmaps/:id — roadmap completo (para abrir/continuar).
router.get('/me/roadmaps/:id', requireAuth, (req, res) => {
  const db = readDB()
  const r = (db.roadmaps || []).find((x) => x.id === req.params.id && x.userId === req.userId)
  if (!r) return res.status(404).json({ error: 'Roadmap não encontrado.' })
  res.json({ roadmap: { ...r, ...roadmapStats(r) } })
})

// POST /api/me/roadmaps — salva um novo roadmap (ao gerar).
router.post('/me/roadmaps', requireAuth, (req, res) => {
  const db = readDB()
  if (!db.roadmaps) db.roadmaps = []

  // Limite de roadmaps salvos do plano (Free: poucos; Pro: ilimitado).
  const owner = db.users.find((u) => u.id === req.userId)
  const cap = PLANS[planOf(owner)].savedRoadmaps
  const count = db.roadmaps.filter((r) => r.userId === req.userId).length
  if (cap != null && count >= cap) {
    return res.status(402).json({
      error: `O plano Free salva até ${cap} roadmaps. Faça upgrade para o Pro para salvar ilimitados.`,
      code: 'UPGRADE_REQUIRED',
      quota: { kind: 'savedRoadmaps', used: count, limit: cap },
    })
  }

  const b = req.body || {}
  const now = new Date().toISOString()
  const roadmap = {
    id: uid('rm'),
    userId: req.userId,
    project: String(b.project || 'Projeto sem nome'),
    level: b.level || 'pleno',
    stack: Array.isArray(b.stack) ? b.stack : [],
    hours: Number(b.hours) || 10,
    source: b.source === 'ai' ? 'ai' : 'mock',
    weeks: b.weeks ?? null,
    totalEffort: b.totalEffort ?? null,
    dependencies: Array.isArray(b.dependencies) ? b.dependencies : [],
    sprints: Array.isArray(b.sprints) ? b.sprints : [],
    createdAt: now,
    updatedAt: now,
  }
  db.roadmaps.push(roadmap)

  // Gerar um roadmap conta como atividade (alimenta a ofensiva).
  const user = db.users.find((u) => u.id === req.userId)
  if (user) touchStreak(user)

  writeDB(db)
  res.status(201).json({ roadmap: { ...roadmap, ...roadmapStats(roadmap) } })
})

// PUT /api/me/roadmaps/:id — atualiza progresso (estado das tarefas).
router.put('/me/roadmaps/:id', requireAuth, (req, res) => {
  const db = readDB()
  const r = (db.roadmaps || []).find((x) => x.id === req.params.id && x.userId === req.userId)
  if (!r) return res.status(404).json({ error: 'Roadmap não encontrado.' })
  if (Array.isArray(req.body?.sprints)) r.sprints = req.body.sprints
  r.updatedAt = new Date().toISOString()
  writeDB(db)
  res.json({ ok: true, ...roadmapStats(r) })
})

// DELETE /api/me/roadmaps/:id
router.delete('/me/roadmaps/:id', requireAuth, (req, res) => {
  const db = readDB()
  const idx = (db.roadmaps || []).findIndex((x) => x.id === req.params.id && x.userId === req.userId)
  if (idx < 0) return res.status(404).json({ error: 'Roadmap não encontrado.' })
  db.roadmaps.splice(idx, 1)
  writeDB(db)
  res.json({ ok: true })
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
