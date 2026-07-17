import { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken, getToken } from '../lib/api'

/* ============================================================================
 * Estado global de autenticação. Mantém o usuário logado, persiste o token e
 * tenta reidratar a sessão (GET /me) ao carregar a página.
 * ==========================================================================*/

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // já tentou reidratar a sessão?

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setReady(true)
      return
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null)) // token inválido/expirado -> limpa
      .finally(() => setReady(true))
  }, [])

  const login = async (identifier, password) => {
    const { token, user } = await api.login({ identifier, password })
    setToken(token)
    setUser(user)
    return user
  }

  const register = async (username, email, password) => {
    const { token, user } = await api.register({ username, email, password })
    setToken(token)
    setUser(user)
    return user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  // Recarrega o usuário do backend (ex: para detectar upgrade de plano pós-pagamento).
  const refresh = async () => {
    try {
      const { user } = await api.me()
      setUser(user)
      return user
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
