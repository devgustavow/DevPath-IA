/* ============================================================================
 * Cliente HTTP do frontend. Centraliza o token JWT (localStorage) e as chamadas
 * à API. Em dev, o Vite faz proxy de /api -> backend (porta 3001).
 * ==========================================================================*/

const TOKEN_KEY = 'devpath_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
  return data
}

export const api = {
  // Auth
  register: (b) => request('/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => request('/auth/me'),

  // Comunidade
  listPosts: (sort = 'hot') => request(`/posts?sort=${sort}`),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (b) => request('/posts', { method: 'POST', body: b }),
  addComment: (id, body) => request(`/posts/${id}/comments`, { method: 'POST', body: { body } }),
  votePost: (id, value) => request(`/posts/${id}/vote`, { method: 'POST', body: { value } }),
  voteComment: (id, value) => request(`/comments/${id}/vote`, { method: 'POST', body: { value } }),

  // Perfil / progressão
  dashboard: () => request('/me/dashboard'),
  activity: (type) => request('/me/activity', { method: 'POST', body: { type } }),
  saveProject: (snapshot) => request('/me/project', { method: 'PUT', body: snapshot }),
  notifications: () => request('/notifications'),
  readNotifications: () => request('/notifications/read', { method: 'POST' }),
}
