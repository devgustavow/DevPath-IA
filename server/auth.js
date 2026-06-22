import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readDB, writeDB, uid, avatarColor } from './db.js'

/* ============================================================================
 * Autenticação real: cadastro/login com senha "hasheada" (bcryptjs) + JWT.
 * O token vai no header Authorization: Bearer <token>.
 * ==========================================================================*/

const router = express.Router()

export const JWT_SECRET = process.env.JWT_SECRET || 'devpath-dev-secret-troque-em-producao'
const TOKEN_TTL = '7d'

// Versão "pública" do usuário (NUNCA expõe o hash da senha).
export function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatarColor: u.avatarColor,
    createdAt: u.createdAt,
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

/* Middleware: exige autenticação válida. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Você precisa estar logado.' })
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub
    next()
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' })
  }
}

/* Helper: extrai o userId se houver token (sem bloquear quando não houver).
 * Usado em rotas de leitura para saber o voto do usuário atual. */
export function softUserId(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET).sub
  } catch {
    return null
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const username = String(req.body?.username || '').trim()
  const email = String(req.body?.email || '').trim()
  const password = String(req.body?.password || '')

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Preencha usuário, email e senha.' })
  }
  if (username.length < 3) return res.status(400).json({ error: 'Usuário precisa de ao menos 3 caracteres.' })
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Email inválido.' })
  if (password.length < 6) return res.status(400).json({ error: 'A senha precisa de ao menos 6 caracteres.' })

  const db = readDB()
  const clash = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase(),
  )
  if (clash) return res.status(409).json({ error: 'Usuário ou email já cadastrado.' })

  const user = {
    id: uid('user'),
    username,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    avatarColor: avatarColor(username),
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  writeDB(db)

  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

// POST /api/auth/login  (identifier = email OU username)
router.post('/login', async (req, res) => {
  const identifier = String(req.body?.identifier || req.body?.email || '').trim()
  const password = String(req.body?.password || '')
  if (!identifier || !password) return res.status(400).json({ error: 'Informe email/usuário e senha.' })

  const db = readDB()
  const user = db.users.find(
    (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase(),
  )
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' })

  res.json({ token: signToken(user), user: publicUser(user) })
})

// GET /api/auth/me  (precisa de token)
router.get('/me', requireAuth, (req, res) => {
  const db = readDB()
  const user = db.users.find((u) => u.id === req.userId)
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' })
  res.json({ user: publicUser(user) })
})

export default router
