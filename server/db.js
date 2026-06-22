import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

/* ============================================================================
 * Persistência simples em arquivo JSON (sem dependências nativas).
 * Guarda usuários, posts, comentários e votos em server/data/db.json.
 * Para um produto real, troque por Postgres/Prisma — a interface é a mesma ideia.
 * ==========================================================================*/

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const EMPTY_DB = { users: [], posts: [], comments: [], votes: [], notifications: [] }

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(EMPTY_DB, null, 2))
}

export function readDB() {
  ensureFile()
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
  } catch {
    return structuredClone(EMPTY_DB)
  }
}

export function writeDB(db) {
  ensureFile()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

// Id curto e único o suficiente para um MVP.
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// Cria uma notificação para um usuário (ex: comentaram/votaram no seu post).
export function addNotification(db, { userId, type, actor, postId, postTitle, text }) {
  if (!db.notifications) db.notifications = []
  db.notifications.push({
    id: uid('notif'),
    userId,
    type, // 'comment' | 'vote' | 'streak'
    actor: actor || null,
    postId: postId || null,
    postTitle: postTitle || null,
    text: text || '',
    read: false,
    createdAt: new Date().toISOString(),
  })
}

// Cor de avatar determinística a partir de uma string (username).
export function avatarColor(seed) {
  const colors = ['#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#22d3ee', '#fb7185', '#4ade80']
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return colors[h % colors.length]
}

/* Cria um usuário-sistema + posts de boas-vindas na primeira execução,
 * para a comunidade não nascer vazia. */
export function seedIfEmpty() {
  const db = readDB()
  if (db.users.length || db.posts.length) return

  const botId = uid('user')
  db.users.push({
    id: botId,
    username: 'devpath',
    email: 'comunidade@devpath.ai',
    passwordHash: bcrypt.hashSync('devpath-seed-' + Math.random(), 8),
    avatarColor: '#34d399',
    createdAt: new Date().toISOString(),
  })

  const now = Date.now()
  db.posts.push({
    id: uid('post'),
    authorId: botId,
    title: 'Bem-vindo(a) à Comunidade DevPath 👋',
    body: 'Este é o espaço para você sair do Tutorial Hell em comunidade: compartilhe o roadmap que a IA gerou, peça review de carreira e troque ideia com outros devs. Crie uma conta e faça seu primeiro post!',
    tag: 'carreira',
    roadmap: null,
    createdAt: new Date(now - 3600e3 * 22).toISOString(),
  })
  db.posts.push({
    id: uid('post'),
    authorId: botId,
    title: 'Dica: poste seu roadmap e peça feedback',
    body: 'Gerou um roadmap na aba "Roadmap"? Clique em "Compartilhar roadmap" e a comunidade ajuda a refinar a ordem dos sprints e o escopo de cada semana. Consistência > velocidade.',
    tag: 'roadmap',
    roadmap: null,
    createdAt: new Date(now - 3600e3 * 4).toISOString(),
  })

  writeDB(db)
}
