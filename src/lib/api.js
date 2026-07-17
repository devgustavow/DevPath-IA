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
  if (!res.ok) {
    const err = new Error(data.error || `Erro ${res.status}`)
    err.code = data.code
    err.status = res.status

    // Eventos globais: abrem o modal certo sem acoplar cada componente.
    if (res.status === 402 && data.code === 'UPGRADE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('devpath:upgrade', { detail: { message: err.message } }))
    } else if (res.status === 401 && !getToken() && !path.startsWith('/auth')) {
      // Rota protegida sem estar logado -> abre o modal de login.
      window.dispatchEvent(new Event('devpath:auth'))
    }
    throw err
  }
  return data
}

export const api = {
  // Auth
  register: (b) => request('/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => request('/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => request('/auth/me'),

  // Roadmap (gerador) + billing
  generateRoadmap: (b) => request('/roadmap', { method: 'POST', body: b }),
  billingPlans: () => request('/billing/plans', { auth: false }),

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
  notifications: () => request('/notifications'),
  readNotifications: () => request('/notifications/read', { method: 'POST' }),

  // Roadmaps do usuário
  listRoadmaps: () => request('/me/roadmaps'),
  getRoadmap: (id) => request(`/me/roadmaps/${id}`),
  createRoadmap: (b) => request('/me/roadmaps', { method: 'POST', body: b }),
  updateRoadmap: (id, b) => request(`/me/roadmaps/${id}`, { method: 'PUT', body: b }),
  deleteRoadmap: (id) => request(`/me/roadmaps/${id}`, { method: 'DELETE' }),

  // Funcionalidades de IA / integrações
  suggestFeatures: (b) => request('/suggest-features', { method: 'POST', body: b }),
  boilerplate: (b) => request('/boilerplate', { method: 'POST', body: b }),
  reviewCode: (b) => request('/review-code', { method: 'POST', body: b }),
  rubberDuck: (b) => request('/rubber-duck', { method: 'POST', body: b }),
  portfolioReadme: (b) => request('/portfolio-readme', { method: 'POST', body: b }),
  exportGithubIssues: (b) => request('/export/github-issues', { method: 'POST', body: b }),
}
