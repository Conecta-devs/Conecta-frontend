import { ref, type Ref } from 'vue'
import type { Socket } from 'socket.io-client'
import {
  createChatSocket,
  type ChatSocketStatus,
} from '@/features/dashboard/services/chatSocket'

/**
 * Socket de chat compartilhado por toda a sessão autenticada do dashboard.
 *
 * A conexão é criada uma única vez por `ensureChatSocket()` (o `DashboardLayout`
 * garante isso ao entrar na sessão) e encerrada por `disposeChatSocketClient()`
 * no logout. As páginas só assinam os eventos com `subscribeChatSocket()` e
 * consomem `chatSocketStatus`/`chatSocketError`, sem criar conexões próprias.
 */
export const chatSocketStatus: Ref<ChatSocketStatus> = ref<ChatSocketStatus>('disconnected')
export const chatSocketError: Ref<string> = ref('')

let chatSocket: Socket | null = null
let disposeSocket: (() => void) | null = null
let refreshSocketAuthentication: (() => Promise<void>) | null = null

export interface ChatSocketHandlers {
  'chat:message:new': (value: unknown) => void
  'chat:presence:snapshot': (value: unknown) => void
  'chat:presence:update': (value: unknown) => void
  'chat:typing': (value: unknown) => void
  'chat:conversation:update': (value: unknown) => void
  'chat:unread:update': (value: unknown) => void
  'chat:message:read': (value: unknown) => void
  'chat:conversation:available': (value: unknown) => void
  'chat:conversation:members': (value: unknown) => void
  'chat:conversation:removed': (value: unknown) => void
}

type ChatSocketEvent = keyof ChatSocketHandlers

/** Garante uma única conexão de chat para a sessão; chamadas repetidas são ignoradas. */
export function ensureChatSocket(): void {
  if (chatSocket) return

  try {
    const connection = createChatSocket(
      (status) => {
        chatSocketStatus.value = status
      },
      (message) => {
        chatSocketError.value = message
      },
    )
    chatSocket = connection.socket
    disposeSocket = connection.dispose
    refreshSocketAuthentication = connection.refreshAuthentication
    chatSocketError.value = ''
  } catch (error) {
    chatSocketStatus.value = 'disconnected'
    chatSocketError.value =
      error instanceof Error ? error.message : 'Não foi possível iniciar o chat em tempo real.'
  }
}

/** Devolve o socket ativo ou `null` quando ainda não há conexão. */
export function getChatSocket(): Socket | null {
  return chatSocket
}

/** Renova o token do socket sem recriar a conexão; sem socket ativo, é um no-op. */
export function refreshChatSocketAuthentication(): Promise<void> {
  const refresh = refreshSocketAuthentication
  if (!refresh) return Promise.resolve()
  return refresh()
}

/** Encerra a conexão e zera as referências, o erro e o status compartilhados. */
export function disposeChatSocketClient(): void {
  disposeSocket?.()
  disposeSocket = null
  refreshSocketAuthentication = null
  chatSocket = null
  chatSocketError.value = ''
  chatSocketStatus.value = 'disconnected'
}

/**
 * Registra os handlers da página no socket compartilhado e devolve o
 * unsubscribe, que remove exatamente os pares evento/handler registrados.
 */
export function subscribeChatSocket(handlers: ChatSocketHandlers): () => void {
  ensureChatSocket()
  const socket = chatSocket
  if (!socket) return () => {}

  const entries = Object.entries(handlers) as Array<[ChatSocketEvent, (value: unknown) => void]>
  for (const [event, handler] of entries) {
    socket.on(event, handler)
  }

  return () => {
    for (const [event, handler] of entries) {
      socket.off(event, handler)
    }
  }
}
