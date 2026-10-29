import {
  clearSession,
  currentUser,
  getStoredAccessToken,
  saveSession,
} from '../../../shared/services/session'
import type { AuthUser } from '../../../shared/types/auth'

const API_URL = '/api'

let refreshPromise: Promise<string> | null = null
let loginRedirectPromise: Promise<void> | null = null

type RefreshFailureKind = 'unauthorized' | 'invalid-response' | 'server' | 'network' | 'http'

class RefreshFailure extends Error {
  readonly kind: RefreshFailureKind

  constructor(kind: RefreshFailureKind, message: string) {
    super(message)
    this.name = 'RefreshFailure'
    this.kind = kind
  }
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UserProfile {
  sub?: string
  name?: string
  email?: string
  bio?: string
  gen?: string
  image?: string
}

function normalizeUserProfile(profile: Partial<UserProfile>): UserProfile {
  return {
    sub: profile.sub,
    name: profile.name ?? '',
    email: profile.email ?? '',
    bio: profile.bio ?? '',
    // Não inventa um gênero padrão: ausência precisa continuar ausente para o
    // modal não sobrescrever o valor real do banco ao salvar.
    gen: profile.gen ?? '',
    image: profile.image ?? '',
  }
}

function sanitizeProfilePayload(payload: Partial<UserProfile>) {
  const next: Record<string, string> = {}

  const name = payload.name?.trim()
  if (name) next.name = name

  const bio = payload.bio?.trim()
  if (bio) next.bio = bio

  const gen = payload.gen?.trim()
  if (gen && !/^(prefiro\s+)?n[ãa]o\s+informar$/i.test(gen)) next.gen = gen

  const image = payload.image?.trim()
  if (image) next.image = image

  return next
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

function fetchWithAccessToken(
  input: RequestInfo | URL,
  init: RequestInit,
  accessToken: string,
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)

  return fetch(input, { ...init, headers })
}

function refreshAccessToken(expectedAccessToken: string): Promise<string> {
  const currentAccessToken = getStoredAccessToken()

  if (currentAccessToken && currentAccessToken !== expectedAccessToken) {
    return Promise.resolve(currentAccessToken)
  }

  if (currentAccessToken !== expectedAccessToken) {
    return Promise.reject(new RefreshFailure('unauthorized', 'A sessão foi encerrada.'))
  }

  if (refreshPromise) {
    return refreshPromise
  }

  const pendingRefresh = (async () => {
    let response: Response
    try {
      response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-CSRF-Protection': '1',
        },
      })
    } catch {
      throw new RefreshFailure('network', 'Falha de rede ao renovar sua sessão.')
    }

    if (response.status === 401) {
      throw new RefreshFailure('unauthorized', 'Sua sessão expirou. Entre novamente.')
    }

    if (!response.ok) {
      const kind = response.status >= 500 ? 'server' : 'http'
      throw new RefreshFailure(kind, 'Não foi possível renovar sua sessão.')
    }

    const data: unknown = await response.json().catch(() => null)
    if (
      !data ||
      typeof data !== 'object' ||
      !('accessToken' in data) ||
      typeof data.accessToken !== 'string' ||
      !data.accessToken.trim()
    ) {
      throw new RefreshFailure('invalid-response', 'A resposta de renovação da sessão é inválida.')
    }

    const latestAccessToken = getStoredAccessToken()
    if (latestAccessToken !== expectedAccessToken) {
      if (latestAccessToken) return latestAccessToken
      throw new RefreshFailure('unauthorized', 'A sessão foi encerrada.')
    }

    const user = currentUser.user
    if (!user) {
      throw new RefreshFailure('unauthorized', 'A sessão foi encerrada.')
    }

    const nextAccessToken = data.accessToken.trim()
    saveSession(user, nextAccessToken)
    return nextAccessToken
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

async function clearSessionAndRedirect(expectedAccessToken: string | null): Promise<void> {
  if (getStoredAccessToken() !== expectedAccessToken) return

  if (!loginRedirectPromise) {
    loginRedirectPromise = (async () => {
      clearSession()
      const { default: router } = await import('../../../router')
      if (router.currentRoute.value.path !== '/login') {
        await router.replace('/login')
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
  init: RequestInit,
): Promise<Response> {
  const accessToken = getStoredAccessToken()
  if (!accessToken) {
    await clearSessionAndRedirect(null)
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const response = await fetchWithAccessToken(input, init, accessToken)
  if (response.status !== 401) return response

  let retryAccessToken: string
  const latestAccessToken = getStoredAccessToken()

  if (latestAccessToken && latestAccessToken !== accessToken) {
    retryAccessToken = latestAccessToken
  } else {
    try {
      retryAccessToken = await refreshAccessToken(accessToken)
    } catch (error) {
      const tokenAfterFailure = getStoredAccessToken()
      if (tokenAfterFailure && tokenAfterFailure !== accessToken) {
        retryAccessToken = tokenAfterFailure
      } else {
        if (
          error instanceof RefreshFailure &&
          (error.kind === 'unauthorized' || error.kind === 'invalid-response')
        ) {
          await clearSessionAndRedirect(accessToken)
        }
        throw error
      }
    }
  }

  const retriedResponse = await fetchWithAccessToken(input, init, retryAccessToken)
  if (retriedResponse.status === 401) {
    await clearSessionAndRedirect(retryAccessToken)
  }

  return retriedResponse
}

const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar. Verifique sua internet e tente novamente.'

/** Mensagem da API: string simples ou lista de erros de validação do NestJS. */
function readApiMessage(body: unknown): string {
  if (!body || typeof body !== 'object' || !('message' in body)) return ''

  const { message } = body as { message?: unknown }

  if (typeof message === 'string') return message.trim()

  if (Array.isArray(message)) {
    return message
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

/**
 * O class-validator responde em inglês ("password must be longer than or equal
 * to 8 characters"). Traduzimos pelo campo citado em vez de exibir o texto cru.
 */
function describeValidationError(body: unknown): string {
  const raw = readApiMessage(body)

  if (/password/i.test(raw)) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (/email/i.test(raw)) return 'Informe um e-mail válido.'
  if (/name/i.test(raw)) return 'Informe um nome com pelo menos 2 caracteres.'

  return 'Confira os dados informados e tente novamente.'
}

/** Converte a resposta de erro do backend na mensagem exibida no formulário. */
async function describeAuthError(
  response: Response,
  fallback: string,
  unauthorizedMessage = 'E-mail ou senha inválidos.',
): Promise<string> {
  const body: unknown = await response.json().catch(() => null)

  switch (response.status) {
    case 400:
      return describeValidationError(body)
    case 401:
      return unauthorizedMessage
    case 403:
      return 'Não foi possível validar a solicitação. Recarregue a página e tente novamente.'
    case 409:
      return 'Este e-mail já está cadastrado.'
    case 429:
      return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.'
    default:
      return response.status >= 500
        ? 'O servidor está indisponível agora. Tente novamente em instantes.'
        : readApiMessage(body) || fallback
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '1',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(await describeAuthError(response, 'Não foi possível fazer login na sua conta.'))
  }

  const data: unknown = await response.json().catch(() => null)
  if (
    !data ||
    typeof data !== 'object' ||
    !('accessToken' in data) ||
    typeof data.accessToken !== 'string' ||
    !data.accessToken.trim() ||
    !('user' in data) ||
    !data.user ||
    typeof data.user !== 'object' ||
    !('name' in data.user) ||
    typeof data.user.name !== 'string' ||
    !('email' in data.user) ||
    typeof data.user.email !== 'string'
  ) {
    throw new Error('A resposta de autenticação é inválida.')
  }

  return {
    accessToken: data.accessToken.trim(),
    user: data.user as AuthUser,
  }
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Protection': '1',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(await describeAuthError(response, 'Não foi possível criar sua conta.'))
  }
}

async function readRecoveryMessage(response: Response, fallbackMessage: string): Promise<string> {
  const data: unknown = await response.json().catch(() => null)
  if (
    !data ||
    typeof data !== 'object' ||
    !('message' in data) ||
    typeof data.message !== 'string' ||
    !data.message.trim()
  ) {
    throw new Error(fallbackMessage)
  }

  return data.message.trim()
}

export async function requestPasswordReset(email: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${API_URL}/auth/forgot-password`, {
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
    response = await fetch(`${API_URL}/auth/reset-password`, {
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
  const response = await fetchProtected(`${API_URL}/auth/profile`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar o perfil do usuário.')
  }

  const data = (await response.json()) as Partial<UserProfile>
  return normalizeUserProfile(data)
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const body = JSON.stringify(sanitizeProfilePayload(payload))

  let response = await fetchProtected(`${API_URL}/auth/edit`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body,
  })

  if (response.status === 404 || response.status === 405) {
    response = await fetchProtected(`${API_URL}/auth/edit`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    })
  }

  if (!response.ok) {
    throw new Error(
      await describeAuthError(
        response,
        'Não foi possível atualizar o perfil do usuário.',
        'Sua sessão expirou. Entre novamente.',
      ),
    )
  }

  const data = (await response.json().catch(() => ({}))) as Partial<UserProfile>
  return normalizeUserProfile(data)
}
