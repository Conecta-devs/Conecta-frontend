import { fetchProtected } from './auth'

const API_URL = '/api/agenda'

export type AgendaKind = 'event' | 'conversation'
export type AgendaFormat = 'online' | 'in_person'

export interface AgendaItem {
  id: string
  title: string
  description: string
  kind: AgendaKind
  format: AgendaFormat
  startsAt: string
  endsAt: string
  meetingUrl: string | null
  location: string | null
  organizerId: string
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AgendaParticipation {
  id: string | null
  agendaItemId: string
  userId: string
  interested: boolean
  confirmed: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface AgendaItemInput {
  title: string
  description: string
  kind: AgendaKind
  format: AgendaFormat
  startsAt: string
  endsAt: string
  meetingUrl?: string | null
  location?: string | null
}

export type UpdateAgendaItemInput = Partial<AgendaItemInput>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAgendaItem(value: unknown): value is AgendaItem {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    (value.kind === 'event' || value.kind === 'conversation') &&
    (value.format === 'online' || value.format === 'in_person') &&
    typeof value.startsAt === 'string' &&
    typeof value.endsAt === 'string' &&
    (typeof value.meetingUrl === 'string' || value.meetingUrl === null) &&
    (typeof value.location === 'string' || value.location === null) &&
    typeof value.organizerId === 'string' &&
    (typeof value.cancelledAt === 'string' || value.cancelledAt === null) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

function isAgendaParticipation(value: unknown): value is AgendaParticipation {
  return (
    isRecord(value) &&
    (typeof value.id === 'string' || value.id === null) &&
    typeof value.agendaItemId === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.interested === 'boolean' &&
    typeof value.confirmed === 'boolean' &&
    (typeof value.createdAt === 'string' || value.createdAt === null) &&
    (typeof value.updatedAt === 'string' || value.updatedAt === null)
  )
}

async function ensureSuccessfulResponse(response: Response): Promise<void> {
  if (response.ok) return

  const body: unknown = await response.json().catch(() => null)
  const message =
    isRecord(body) && typeof body.message === 'string' && body.message.trim()
      ? body.message.trim()
      : `A solicitação da Agenda falhou (HTTP ${response.status}).`

  throw new Error(message)
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null)
  if (body === null) {
    throw new Error('A resposta da Agenda é inválida.')
  }
  return body
}

function agendaRequest(method: 'POST' | 'PATCH' | 'PUT', body: unknown): RequestInit {
  return {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

function itemPath(id: string): string {
  return `${API_URL}/${encodeURIComponent(id)}`
}

async function readAgendaItem(response: Response): Promise<AgendaItem> {
  await ensureSuccessfulResponse(response)
  const body = await readJsonResponse(response)
  if (!isAgendaItem(body)) {
    throw new Error('A resposta do encontro é inválida.')
  }
  return body
}

export async function listAgendaItems(): Promise<AgendaItem[]> {
  const response = await fetchProtected(API_URL, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await ensureSuccessfulResponse(response)

  const body = await readJsonResponse(response)
  if (!Array.isArray(body) || !body.every(isAgendaItem)) {
    throw new Error('A lista de encontros retornada pela API é inválida.')
  }
  return body
}

export async function getAgendaItem(id: string): Promise<AgendaItem> {
  return readAgendaItem(
    await fetchProtected(itemPath(id), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }),
  )
}

export async function createAgendaItem(input: AgendaItemInput): Promise<AgendaItem> {
  return readAgendaItem(await fetchProtected(API_URL, agendaRequest('POST', input)))
}

export async function updateAgendaItem(
  id: string,
  input: UpdateAgendaItemInput,
): Promise<AgendaItem> {
  return readAgendaItem(await fetchProtected(itemPath(id), agendaRequest('PATCH', input)))
}

export async function cancelAgendaItem(id: string): Promise<AgendaItem> {
  return readAgendaItem(
    await fetchProtected(`${itemPath(id)}/cancel`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    }),
  )
}

export async function getMyAgendaParticipation(id: string): Promise<AgendaParticipation> {
  const response = await fetchProtected(`${itemPath(id)}/participation/me`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await ensureSuccessfulResponse(response)

  const body = await readJsonResponse(response)
  if (!isAgendaParticipation(body)) {
    throw new Error('A resposta da participação é inválida.')
  }
  return body
}

async function updateParticipation(
  id: string,
  action: 'interest' | 'attendance',
  body: { interested: boolean } | { confirmed: boolean },
): Promise<AgendaParticipation> {
  const response = await fetchProtected(
    `${itemPath(id)}/participation/${action}`,
    agendaRequest('PUT', body),
  )
  await ensureSuccessfulResponse(response)

  const responseBody = await readJsonResponse(response)
  if (!isAgendaParticipation(responseBody)) {
    throw new Error('A resposta da participação é inválida.')
  }
  return responseBody
}

export function updateAgendaInterest(
  id: string,
  interested: boolean,
): Promise<AgendaParticipation> {
  return updateParticipation(id, 'interest', { interested })
}

export function updateAgendaAttendance(
  id: string,
  confirmed: boolean,
): Promise<AgendaParticipation> {
  return updateParticipation(id, 'attendance', { confirmed })
}
