import { reactive } from 'vue'
import type { AuthUser } from './auth'

const SESSION_KEY = 'conecta_session'

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
  localStorage.setItem('course', user.course)

  if (token) {
    localStorage.setItem('token', token)
    localStorage.setItem('conecta_token', token)
  }
}

export function clearSession() {
  currentUser.user = null
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('token')
  localStorage.removeItem('conecta_token')
}
