import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from './api'
import { getUserProfile } from './auth'
import { getStoredAccessToken } from './session'

export type ChatSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface SocketAcknowledgement<T> {
  ok: boolean
  data?: T
  error?: {
    statusCode: number
    message: string | string[]
  }
}

export class ChatSocketError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ChatSocketError'
    this.statusCode = statusCode
  }
}

export interface ChatSocketConnection {
  socket: Socket
  dispose: () => void
  refreshAuthentication: () => Promise<void>
}

export function createChatSocket(
  onStatus: (status: ChatSocketStatus) => void,
  onError: (message: string) => void,
): ChatSocketConnection {
  const token = getStoredAccessToken()
  if (!token) {
    throw new Error('Sessão expirada. Entre novamente para usar o chat.')
  }

  const socketBaseUrl = new URL(API_BASE_URL, window.location.origin)
  const socket = io(socketBaseUrl.origin, {
    path: '/socket.io',
    autoConnect: false,
    withCredentials: true,
    auth: { token },
  })

  let recoveryTimer: ReturnType<typeof setTimeout> | null = null
  let recoveryAttempts = 0
  let recovering = false
  let disposed = false

  const recoverAuthentication = async (forceReconnect = false) => {
    if (recovering || disposed) return
    recovering = true
    try {
      await getUserProfile()
      if (disposed) return
      const currentToken = getStoredAccessToken()
      if (!currentToken) {
        throw new Error('Sessão expirada. Entre novamente para usar o chat.')
      }
      socket.auth = { token: currentToken }
      recoveryAttempts = 0
      if (forceReconnect && socket.connected) socket.disconnect()
      if (!socket.connected) socket.connect()
    } catch (error) {
      recoveryAttempts += 1
      const message =
        error instanceof Error ? error.message : 'A conexão com o chat foi interrompida.'
      onError(message)
      const delay = Math.min(1_000 * 2 ** Math.min(recoveryAttempts - 1, 5), 30_000)
      if (!disposed) {
        recoveryTimer = setTimeout(() => {
          recoveryTimer = null
          recovering = false
          void recoverAuthentication()
        }, delay)
      }
    } finally {
      if (!recoveryTimer) recovering = false
    }
  }

  socket.on('connect', () => {
    recoveryAttempts = 0
    if (recoveryTimer) clearTimeout(recoveryTimer)
    recoveryTimer = null
    recovering = false
    onStatus('connected')
  })

  socket.on('disconnect', (reason: string) => {
    onStatus('reconnecting')
    if (reason === 'io server disconnect') void recoverAuthentication()
  })

  socket.on('connect_error', (error: Error) => {
    onStatus('reconnecting')
    onError(error.message || 'Não foi possível conectar ao chat.')
  })

  socket.io.on('reconnect_attempt', () => {
    const currentToken = getStoredAccessToken()
    if (currentToken) socket.auth = { token: currentToken }
    onStatus('reconnecting')
  })
  socket.io.on('reconnect_failed', () => {
    onStatus('disconnected')
    onError('Não foi possível reconectar ao chat.')
  })

  onStatus('connecting')
  socket.connect()

  const dispose = () => {
    disposed = true
    if (recoveryTimer) clearTimeout(recoveryTimer)
    socket.removeAllListeners()
    socket.io.removeAllListeners()
    socket.disconnect()
  }

  return {
    socket,
    dispose,
    refreshAuthentication: () => recoverAuthentication(true),
  }
}

export function emitChatSocketAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 10_000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    socket
      .timeout(timeoutMs)
      .emit(event, payload, (timeoutError: Error | null, response: unknown) => {
        if (timeoutError) {
          reject(new Error('A confirmação do servidor demorou. Tente novamente.'))
          return
        }
        if (
          typeof response !== 'object' ||
          response === null ||
          !('ok' in response) ||
          typeof response.ok !== 'boolean'
        ) {
          reject(new Error('A confirmação do servidor é inválida.'))
          return
        }

        const acknowledgement = response as SocketAcknowledgement<T>
        if (!acknowledgement.ok) {
          const error = acknowledgement.error
          reject(
            new ChatSocketError(
              Array.isArray(error?.message)
                ? error.message.join(' ')
                : (error?.message ?? 'O servidor recusou a solicitação.'),
              error?.statusCode,
            ),
          )
          return
        }
        if (!('data' in acknowledgement) || acknowledgement.data === undefined) {
          reject(new Error('A confirmação do servidor não contém resultado.'))
          return
        }
        resolve(acknowledgement.data)
      })
  })
}
