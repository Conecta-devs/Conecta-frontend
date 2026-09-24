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

function readCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() ?? null
  }
  return null
}

export function getStoredAccessToken(): string | null {
  const localToken = localStorage.getItem(TOKEN_KEY)
  if (localToken) {
    return localToken
  }

  return readCookie('accessToken') ?? readCookie('token') ?? readCookie('jwt')
}

export const currentUser = reactive<{ user: AuthUser | null }>({
  user: loadSession(),
})

export function isAuthenticated(): boolean {
  return Boolean(currentUser.user)
}

export function saveSession(user: AuthUser, accessToken?: string) {
  currentUser.user = user
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  localStorage.setItem('userName', user.name)
  localStorage.setItem('userEmail', user.email)
  if (user.image) {
    localStorage.setItem('userImage', user.image)
  } else {
    localStorage.removeItem('userImage')
  }

  const token = accessToken ?? getStoredAccessToken()
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearSession() {
  currentUser.user = null
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userImage')
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'jwt=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'accessToken=; Max-Age=0; path=/; SameSite=Lax'
}
