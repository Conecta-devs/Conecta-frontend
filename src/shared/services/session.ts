import { reactive } from 'vue'
import type { AuthUser } from '../types/auth'

const SESSION_KEY = 'conecta_session'
const TOKEN_KEY = 'conecta_access_token'
const LAST_EMAIL_KEY = 'conecta_last_email'

/**
 * Chaves antigas gravadas separadamente. A sessão agora vive apenas em
 * `conecta_session`.
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

/**
 * Último e-mail usado no login, preservado ao encerrar a sessão para a tela
 * de login abrir preenchida. Nunca guarda senha nem token.
 */
export function getLastEmail(): string {
  return localStorage.getItem(LAST_EMAIL_KEY) ?? ''
}

/** Salva o e-mail; `null`/vazio remove o valor guardado. */
export function saveLastEmail(email?: string | null) {
  const value = email?.trim() ?? ''

  if (value) {
    localStorage.setItem(LAST_EMAIL_KEY, value)
  } else {
    localStorage.removeItem(LAST_EMAIL_KEY)
  }
}

export function clearSession() {
  // Preserva o e-mail da conta para a tela de login abrir preenchida.
  saveLastEmail(currentUser.user?.email)
  currentUser.user = null
  localStorage.removeItem(SESSION_KEY)
  saveAccessToken(null)
  clearLegacyUserKeys()
  document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'jwt=; Max-Age=0; path=/; SameSite=Lax'
  document.cookie = 'accessToken=; Max-Age=0; path=/; SameSite=Lax'
}
