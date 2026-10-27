import { reactive } from 'vue'
import type { AuthUser } from './auth'

const SESSION_KEY = 'conecta_session'
const TOKEN_KEY = 'conecta_access_token'

function loadSession(): AuthUser | null {
  const savedSession = localStorage.getItem(SESSION_KEY)

  if (!savedSession) {
    return null
  }

  try {
    return JSON.parse(savedSession) as AuthUser
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export const currentUser = reactive<{ user: AuthUser | null }>({
  user: loadSession(),
})

export function saveSession(user: AuthUser, token?: string) {
  currentUser.user = user
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  localStorage.setItem('userName', user.name)
  localStorage.setItem('userEmail', user.email)
  localStorage.setItem('course', user.course ?? '')
  if (user.image) {
    localStorage.setItem('userImage', user.image)
  } else {
    localStorage.removeItem('userImage')
  }

  const accessToken = token ?? getStoredAccessToken()
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem('token', accessToken)
    localStorage.setItem('conecta_token', accessToken)
  }
}

export function isAuthenticated(): boolean {
  return Boolean(currentUser.user)
}

export function getStoredAccessToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('conecta_token') ||
    localStorage.getItem('token')
  )
}

export function clearSession() {
  currentUser.user = null
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('course')
  localStorage.removeItem('userImage')
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('token')
  localStorage.removeItem('conecta_token')
}
