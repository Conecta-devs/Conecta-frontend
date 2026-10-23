import { getStoredAccessToken } from '../../../shared/services/session'
import type { AuthUser } from '../../../shared/types/auth'

const API_URL = '/api'

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
  name?: string
  email?: string
  bio?: string
  gen?: string
  image?: string
}

function normalizeUserProfile(profile: Partial<UserProfile>): UserProfile {
  return {
    name: profile.name ?? '',
    email: profile.email ?? '',
    bio: profile.bio ?? '',
    gen: profile.gen ?? 'Não informar',
    image: profile.image ?? '',
  }
}

function buildAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = getStoredAccessToken()

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function sanitizeProfilePayload(payload: Partial<UserProfile>) {
  const next: Record<string, string> = {}

  const name = payload.name?.trim()
  if (name) next.name = name

  const bio = payload.bio?.trim()
  if (bio) next.bio = bio

  const gen = payload.gen?.trim()
  if (gen && gen !== 'Não informar') next.gen = gen

  const image = payload.image?.trim()
  if (image) next.image = image

  return next
}

export interface LoginResponse {
  accessToken?: string
  token?: string
  user: AuthUser
}

export interface RegisterResponse {
  accessToken?: string
  token?: string
  user?: AuthUser
}

export async function LoginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível fazer login na sua conta.')
  }

  return response.json() as Promise<LoginResponse>
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível criar sua conta.')
  }

  // Alguns backends devolvem usuário/token no cadastro; outros, apenas sucesso.
  return (await response.json().catch(() => ({}))) as RegisterResponse
}

export async function getUserProfile(): Promise<UserProfile> {
  const token = getStoredAccessToken()

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    credentials: 'include',
    headers: buildAuthHeaders({
      Accept: 'application/json',
    }),
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar o perfil do usuário.')
  }

  const data = (await response.json()) as Partial<UserProfile>
  return normalizeUserProfile(data)
}

export async function updateUserProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const token = getStoredAccessToken()

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const body = JSON.stringify(sanitizeProfilePayload(payload))

  let response = await fetch(`${API_URL}/auth/edit`, {
    method: 'PUT',
    credentials: 'include',
    headers: buildAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body,
  })

  if (response.status === 404 || response.status === 405) {
    response = await fetch(`${API_URL}/auth/edit`, {
      method: 'PATCH',
      credentials: 'include',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body,
    })
  }

  if (!response.ok) {
    throw new Error('Não foi possível atualizar o perfil do usuário.')
  }

  const data = (await response.json().catch(() => ({}))) as Partial<UserProfile>
  return normalizeUserProfile(data)
}
