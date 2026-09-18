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

export interface AuthUser {
  name: string
  email: string
  course: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export async function LoginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível fazer login na sua conta.')
  }

  return response.json() as Promise<LoginResponse>
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Não foi possível criar sua conta.')
  }
}
