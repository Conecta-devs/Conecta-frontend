import { apiUrl, fetchApi } from './api'
import { clearSession, currentUser, getStoredAccessToken, saveSession } from './session'

export interface AuthUser {
  sub?: string
  name: string
  email: string
  course?: string
  image?: string | null
  bio?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
}

export type UserProfile = AuthUser

type RefreshFailureKind = 'unauthorized' | 'network' | 'server' | 'http' | 'invalid-response'

class RefreshFailure extends Error {
  readonly kind: RefreshFailureKind

  constructor(kind: RefreshFailureKind, message: string) {
    super(message)
    this.name = 'RefreshFailure'
    this.kind = kind
  }
}

let refreshPromise: Promise<string> | null = null
let loginRedirectPromise: Promise<void> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeUser(value: unknown): AuthUser | null {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.email !== 'string') {
    return null
  }

  const sub = typeof value.sub === 'string' ? value.sub : value.id
  return {
    ...(typeof sub === 'string' ? { sub } : {}),
    name: value.name,
    email: value.email,
    ...(typeof value.course === 'string' ? { course: value.course } : {}),
    ...(typeof value.image === 'string' || value.image === null ? { image: value.image } : {}),
    ...(typeof value.bio === 'string' ? { bio: value.bio } : {}),
  }
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null)
  if (isRecord(data) && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }
  if (
    isRecord(data) &&
    Array.isArray(data.message) &&
    data.message.every((item) => typeof item === 'string')
  ) {
    return data.message.join(' ')
  }
  return fallback
}

async function refreshAccessToken(expectedAccessToken: string): Promise<string> {
  if (getStoredAccessToken() !== expectedAccessToken) {
    const latestAccessToken = getStoredAccessToken()
    if (latestAccessToken) return latestAccessToken
    throw new RefreshFailure('unauthorized', 'A sessão foi encerrada.')
  }

  if (refreshPromise) return refreshPromise

  const pendingRefresh = (async () => {
    let response: Response
    try {
      response = await fetchApi(apiUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-CSRF-Protection': '1' },
      })
    } catch {
      throw new RefreshFailure('network', 'Falha de rede ao renovar sua sessão.')
    }

    if (response.status === 401) {
      throw new RefreshFailure('unauthorized', 'Sua sessão expirou. Entre novamente.')
    }
    if (!response.ok) {
      throw new RefreshFailure(
        response.status >= 500 ? 'server' : 'http',
        await responseMessage(response, 'Não foi possível renovar sua sessão.'),
      )
    }

    const data: unknown = await response.json().catch(() => null)
    if (!isRecord(data) || typeof data.accessToken !== 'string' || !data.accessToken.trim()) {
      throw new RefreshFailure('invalid-response', 'A resposta de renovação da sessão é inválida.')
    }

    if (getStoredAccessToken() !== expectedAccessToken) {
      const latestAccessToken = getStoredAccessToken()
      if (latestAccessToken) return latestAccessToken
      throw new RefreshFailure('unauthorized', 'A sessão foi encerrada.')
    }

    const user = currentUser.user
    if (!user) throw new RefreshFailure('unauthorized', 'A sessão foi encerrada.')
    saveSession(user, data.accessToken)
    return data.accessToken
  })()

  refreshPromise = pendingRefresh
  void pendingRefresh.then(
    () => {
      if (refreshPromise === pendingRefresh) refreshPromise = null
    },
    () => {
      if (refreshPromise === pendingRefresh) refreshPromise = null
    },
  )
  return pendingRefresh
}

async function redirectToLogin(expectedAccessToken: string): Promise<void> {
  if (getStoredAccessToken() !== expectedAccessToken) return

  if (!loginRedirectPromise) {
    loginRedirectPromise = (async () => {
      clearSession()
      const { default: router } = await import('../router')
      if (router.currentRoute.value.path !== '/login') {
        await router.push('/login')
      }
    })()
  }

  const pendingRedirect = loginRedirectPromise
  try {
    await pendingRedirect
  } finally {
    if (loginRedirectPromise === pendingRedirect) loginRedirectPromise = null
  }
}

export async function fetchProtected(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = getStoredAccessToken()
  if (!accessToken) throw new Error('Sessão expirada. Entre novamente.')

  const send = (token: string) => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetchApi(input, { ...init, headers })
  }

  let response = await send(accessToken)
  if (response.status !== 401) return response

  try {
    const refreshedToken = await refreshAccessToken(accessToken)
    response = await send(refreshedToken)
    if (response.status === 401) await redirectToLogin(refreshedToken)
    return response
  } catch (error) {
    if (
      error instanceof RefreshFailure &&
      (error.kind === 'unauthorized' || error.kind === 'invalid-response')
    ) {
      await redirectToLogin(accessToken)
    }
    throw error
  }
}

export async function LoginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetchApi(apiUrl('/auth/login'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Não foi possível entrar na sua conta.'))
  }

  const data: unknown = await response.json().catch(() => null)
  const user = isRecord(data) ? normalizeUser(data.user) : null
  if (!user || !isRecord(data) || typeof data.accessToken !== 'string') {
    throw new Error('A resposta de autenticação é inválida.')
  }
  return { user, accessToken: data.accessToken }
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const response = await fetchApi(apiUrl('/auth/register'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Não foi possível criar sua conta.'))
  }
}

async function readRecoveryMessage(response: Response, fallbackMessage: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null)
  if (!isRecord(data) || typeof data.message !== 'string' || !data.message.trim()) {
    throw new Error(fallbackMessage)
  }
  return data.message.trim()
}

export async function requestPasswordReset(email: string): Promise<string> {
  let response: Response
  try {
    response = await fetchApi(apiUrl('/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
  } catch {
    throw new Error('Não foi possível conectar. Tente novamente em instantes.')
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Muitas tentativas. Aguarde um pouco antes de tentar novamente.')
    }
    throw new Error('Não foi possível solicitar a redefinição agora. Tente novamente.')
  }

  return readRecoveryMessage(response, 'Não foi possível confirmar a solicitação. Tente novamente.')
}

export async function resetPassword(token: string, password: string): Promise<string> {
  let response: Response
  try {
    response = await fetchApi(apiUrl('/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
  } catch {
    throw new Error('Não foi possível conectar. Tente novamente em instantes.')
  }

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Este link é inválido, expirou ou já foi utilizado. Solicite outro link.')
    }
    if (response.status === 429) {
      throw new Error('Muitas tentativas. Aguarde um pouco antes de tentar novamente.')
    }
    throw new Error('Não foi possível redefinir a senha agora. Tente novamente.')
  }

  return readRecoveryMessage(response, 'Não foi possível confirmar a redefinição da senha.')
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetchProtected(apiUrl('/auth/profile'), {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Não foi possível carregar seu perfil.'))
  }

  const data: unknown = await response.json().catch(() => null)
  const profile = normalizeUser(isRecord(data) && 'user' in data ? data.user : data)
  if (!profile) throw new Error('A resposta do perfil é inválida.')
  return profile
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const body = JSON.stringify({
    ...(typeof payload.name === 'string' ? { name: payload.name } : {}),
    ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
    ...(typeof payload.course === 'string' ? { course: payload.course } : {}),
    ...(typeof payload.image === 'string' || payload.image === null
      ? { image: payload.image }
      : {}),
    ...(typeof payload.bio === 'string' ? { bio: payload.bio } : {}),
  })
  let response = await fetchProtected(apiUrl('/auth/edit'), {
    method: 'PUT',
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body,
  })

  if (response.status === 404 || response.status === 405) {
    response = await fetchProtected(apiUrl('/auth/edit'), {
      method: 'PATCH',
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
    })
  }
  if (!response.ok) {
    throw new Error(await responseMessage(response, 'Não foi possível atualizar seu perfil.'))
  }

  const data: unknown = await response.json().catch(() => null)
  const profile = normalizeUser(isRecord(data) && 'user' in data ? data.user : data)
  if (!profile) throw new Error('A resposta de atualização do perfil é inválida.')
  return profile
}
