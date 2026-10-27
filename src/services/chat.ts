import { currentUser } from './session'
import { fetchProtected } from './auth'
import { apiUrl } from './api'

export type ChatCategory = 'community' | 'friend'
export type ChatRole = 'admin' | 'member'

export interface ChatUserSuggestion {
  id: string
  name: string
  image: string | null
}

export interface ChatUserPage {
  users: ChatUserSuggestion[]
  page: number
  limit: number
  hasMore: boolean
}

export interface ChatMember {
  userId: string
  name: string | null
  image: string | null
  role: ChatRole
  joinedAt: string
}

export interface ChatConversation {
  id: string
  name: string
  image: string | null
  otherUserId: string | null
  preview: string
  category: ChatCategory
  updatedAt: string
  lastMessage: {
    content: string
    senderId: string | null
    sequence: number
    createdAt: string
  } | null
  unreadCount: number
  members: ChatMember[]
  currentUserRole: ChatRole
  lastReadSequence: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  sequence: number
  clientMessageId: string
  content: string
  createdAt: string
  isMine: boolean
  deliveryStatus?: 'sending' | 'failed'
}

export interface ChatMessagePage {
  messages: ChatMessage[]
  nextCursor: string | null
}

export class ChatApiError extends Error {
  readonly statusCode: number
  readonly error?: string

  constructor(message: string, statusCode: number, error?: string) {
    super(message)
    this.name = 'ChatApiError'
    this.statusCode = statusCode
    this.error = error
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getCurrentUserId(): string {
  const userId = currentUser.user?.sub
  if (!userId) {
    throw new Error('Não foi possível identificar o usuário autenticado.')
  }
  return userId
}

function isChatUserSuggestion(value: unknown): value is ChatUserSuggestion {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (typeof value.image === 'string' || value.image === null)
  )
}

function isChatMember(value: unknown): value is ChatMember {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    (typeof value.name === 'string' || value.name === null) &&
    (typeof value.image === 'string' || value.image === null) &&
    (value.role === 'admin' || value.role === 'member') &&
    typeof value.joinedAt === 'string'
  )
}

export function normalizeChatConversation(value: unknown): ChatConversation {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    (value.kind !== 'direct' && value.kind !== 'group') ||
    !(typeof value.title === 'string' || value.title === null) ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.members) ||
    !value.members.every(isChatMember) ||
    typeof value.unreadCount !== 'number' ||
    !Number.isFinite(value.unreadCount) ||
    !(
      value.lastMessage === null ||
      (isRecord(value.lastMessage) &&
        (typeof value.lastMessage.content === 'string' || value.lastMessage.content === null) &&
        (typeof value.lastMessage.senderId === 'string' || value.lastMessage.senderId === null) &&
        typeof value.lastMessage.sequence === 'number' &&
        typeof value.lastMessage.createdAt === 'string')
    )
  ) {
    throw new Error('A resposta da conversa retornada pela API é inválida.')
  }

  const currentUserId = getCurrentUserId()
  const members = value.members
  const otherMember =
    value.kind === 'direct' ? members.find((member) => member.userId !== currentUserId) : undefined
  const name =
    value.kind === 'group' ? (value.title ?? 'Grupo') : (otherMember?.name ?? 'Conversa individual')
  let lastMessage: ChatConversation['lastMessage'] = null
  if (isRecord(value.lastMessage)) {
    if (
      typeof value.lastMessage.sequence !== 'number' ||
      typeof value.lastMessage.createdAt !== 'string'
    ) {
      throw new Error('A última mensagem retornada pela API é inválida.')
    }
    lastMessage = {
      content: typeof value.lastMessage.content === 'string' ? value.lastMessage.content : '',
      senderId: typeof value.lastMessage.senderId === 'string' ? value.lastMessage.senderId : null,
      sequence: value.lastMessage.sequence,
      createdAt: value.lastMessage.createdAt,
    }
  }
  const currentMember = members.find((member) => member.userId === currentUserId)

  return {
    id: value.id,
    name,
    image: otherMember?.image ?? null,
    otherUserId: otherMember?.userId ?? null,
    preview: lastMessage?.content ?? 'Sem mensagens',
    category: value.kind === 'direct' ? 'friend' : 'community',
    updatedAt: value.updatedAt,
    lastMessage,
    unreadCount: value.unreadCount,
    members,
    currentUserRole:
      value.currentUserRole === 'admin' || currentMember?.role === 'admin' ? 'admin' : 'member',
    lastReadSequence: typeof value.lastReadSequence === 'number' ? value.lastReadSequence : 0,
  }
}

export function normalizeChatMessage(value: unknown, conversationId: string): ChatMessage {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.conversationId !== conversationId ||
    typeof value.senderId !== 'string' ||
    typeof value.sequence !== 'number' ||
    typeof value.clientMessageId !== 'string' ||
    typeof value.content !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    throw new Error('A resposta da mensagem retornada pela API é inválida.')
  }

  return {
    id: value.id,
    conversationId,
    senderId: value.senderId,
    sequence: value.sequence,
    clientMessageId: value.clientMessageId,
    content: value.content,
    createdAt: value.createdAt,
    isMine: value.senderId === getCurrentUserId(),
  }
}

async function ensureSuccessfulResponse(response: Response): Promise<void> {
  if (response.ok) return

  const body: unknown = await response.json().catch(() => null)
  const rawMessage = isRecord(body) ? body.message : undefined
  const message = Array.isArray(rawMessage)
    ? rawMessage.filter((item): item is string => typeof item === 'string').join(' ')
    : typeof rawMessage === 'string'
      ? rawMessage.trim()
      : ''

  throw new ChatApiError(
    message || `A solicitação do chat falhou (HTTP ${response.status}).`,
    isRecord(body) && typeof body.statusCode === 'number' ? body.statusCode : response.status,
    isRecord(body) && typeof body.error === 'string' ? body.error : undefined,
  )
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null)
  if (body === null) {
    throw new Error('A resposta do chat é inválida.')
  }
  return body
}

async function requestJson(path: `/${string}`, init: RequestInit): Promise<unknown> {
  const response = await fetchProtected(apiUrl(path), {
    credentials: 'include',
    headers: { Accept: 'application/json', ...init.headers },
    ...init,
  })
  await ensureSuccessfulResponse(response)
  if (response.status === 204) return null
  return readJsonResponse(response)
}

export async function searchChatUsers(
  search: string,
  page = 1,
  limit = 24,
  signal?: AbortSignal,
): Promise<ChatUserPage> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  if (search.trim()) query.set('search', search.trim())

  const body = await requestJson(`/chat/users?${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (
    !isRecord(body) ||
    !Array.isArray(body.users) ||
    !body.users.every(isChatUserSuggestion) ||
    typeof body.page !== 'number' ||
    typeof body.limit !== 'number' ||
    typeof body.hasMore !== 'boolean'
  ) {
    throw new Error('A lista de pessoas retornada pela API é inválida.')
  }
  const currentUserId = getCurrentUserId()
  return {
    users: body.users.filter((user) => user.id !== currentUserId),
    page: body.page,
    limit: body.limit,
    hasMore: body.hasMore,
  }
}

export async function listChatConversations(signal?: AbortSignal): Promise<ChatConversation[]> {
  const body = await requestJson('/chat/conversations', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!Array.isArray(body)) {
    throw new Error('A lista de conversas retornada pela API é inválida.')
  }
  return body.map(normalizeChatConversation)
}

export async function createOrGetDirectConversation(
  participantId: string,
): Promise<ChatConversation> {
  const body = await requestJson('/chat/conversations/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId }),
  })
  return normalizeChatConversation(body)
}

export async function createChatGroup(
  name: string,
  memberIds: string[],
): Promise<ChatConversation> {
  const body = await requestJson('/chat/conversations/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, memberIds }),
  })
  return normalizeChatConversation(body)
}

export async function getChatConversation(conversationId: string): Promise<ChatConversation> {
  const body = await requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return normalizeChatConversation(body)
}

export async function listChatMessages(
  conversationId: string,
  options: { cursor?: string; limit?: number; signal?: AbortSignal } = {},
): Promise<ChatMessagePage> {
  const query = new URLSearchParams()
  query.set('limit', String(options.limit ?? 50))
  if (options.cursor) query.set('before', options.cursor)

  const body = await requestJson(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages?${query}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options.signal,
    },
  )
  if (
    !isRecord(body) ||
    !Array.isArray(body.messages) ||
    !(typeof body.nextCursor === 'string' || body.nextCursor === null)
  ) {
    throw new Error('A página de mensagens retornada pela API é inválida.')
  }
  return {
    messages: body.messages.map((message) => normalizeChatMessage(message, conversationId)),
    nextCursor: body.nextCursor,
  }
}

export async function markChatConversationRead(
  conversationId: string,
): Promise<{ conversationId: string; lastReadSequence: number; unreadCount: number }> {
  const body = await requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: 'POST',
  })
  if (
    !isRecord(body) ||
    typeof body.conversationId !== 'string' ||
    typeof body.lastReadSequence !== 'number' ||
    typeof body.unreadCount !== 'number'
  ) {
    throw new Error('A resposta da confirmação de leitura é inválida.')
  }
  return {
    conversationId: body.conversationId,
    lastReadSequence: body.lastReadSequence,
    unreadCount: body.unreadCount,
  }
}

export async function addChatMembers(conversationId: string, memberIds: string[]): Promise<void> {
  await requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberIds }),
  })
}

export async function removeChatMember(conversationId: string, memberId: string): Promise<void> {
  await requestJson(
    `/chat/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(memberId)}`,
    { method: 'DELETE' },
  )
}

export async function leaveChatGroup(conversationId: string): Promise<void> {
  await requestJson(`/chat/conversations/${encodeURIComponent(conversationId)}/leave`, {
    method: 'POST',
  })
}
