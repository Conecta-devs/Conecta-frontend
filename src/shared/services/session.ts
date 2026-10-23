import { reactive } from 'vue'
import type { AuthUser } from '../types/auth'

const SESSION_KEY = 'conecta_session'
const TOKEN_KEY = 'conecta_access_token'

/**
 * Chaves antigas gravadas separadamente. A sessão agora vive apenas em
 * `conecta_session`; mantemos a limpeza para migrar quem já usava o app.
 */
const LEGACY_USER_KEYS = ['userName', 'userEmail', 'userImage'] as const

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
  const prefix = `${name}=`
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(prefix))

  if (!cookie) {
    return null
  }

  return decodeURIComponent(cookie.slice(prefix.length))
}

/**
 * Única fonte de leitura do token. O usuário autenticado continua sendo
 * `currentUser` (carregado de `conecta_session`); o token é um detalhe da
 * sessão usado pelos serviços de API.
 */
export function getStoredAccessToken(): string | null {
  const localToken = localStorage.getItem(TOKEN_KEY)
  if (localToken) {
    return localToken
  }

  return readCookie('accessToken') ?? readCookie('token') ?? readCookie('jwt')
}

function clearLegacyUserKeys() {
  for (const key of LEGACY_USER_KEYS) {
    localStorage.removeItem(key)
  }
}

export const currentUser = reactive<{ user: AuthUser | null }>({
  user: loadSession(),
})

export function isAuthenticated(): boolean {
  return Boolean(currentUser.user && getStoredAccessToken())
}

/** Única fonte de escrita do token (login, cadastro e limpeza). */
export function saveAccessToken(accessToken: string | null) {
  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * Salva usuário e token no mesmo serviço. Passe `accessToken` como `null`
 * quando a API responder sem token para limpar um token antigo; omita o
 * argumento em atualizações de perfil para preservar o token atual.
 */
export function saveSession(user: AuthUser, accessToken?: string | null) {
  currentUser.user = user
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  clearLegacyUserKeys()

  if (accessToken !== undefined) {
    saveAccessToken(accessToken)
  }
}

export function clearSession() {
  currentUser.user = null
  localStorage.removeItem(SESSION_KEY)
  saveAccessToken(null)
  clearLegacyUserKeys()
  document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'jwt=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'accessToken=; Max-Age=0; path=/; SameSite=Lax'
}
