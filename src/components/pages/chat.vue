<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Socket } from 'socket.io-client'
import {
  faArrowLeft,
  faEllipsis,
  faFaceSmile,
  faPaperclip,
  faPaperPlane,
  faPhone,
  faSearch,
  faUsers,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'
import {
  addChatMembers,
  ChatApiError,
  createChatGroup,
  createOrGetDirectConversation,
  getChatConversation,
  leaveChatGroup,
  listChatConversations,
  listChatMessages,
  markChatConversationRead,
  normalizeChatMessage,
  removeChatMember,
  searchChatUsers,
  type ChatConversation,
  type ChatMember,
  type ChatMessage,
  type ChatUserSuggestion,
} from '../../services/chat'
import {
  createChatSocket,
  emitChatSocketAck,
  ChatSocketError,
  type ChatSocketStatus,
} from '../../services/chatSocket'
import { currentUser } from '../../services/session'

type ChatSection = 'recent' | 'community' | 'friend' | 'people'
type ChatContextTarget =
  | { type: 'conversation'; conversation: ChatConversation }
  | { type: 'user'; user: ChatUserSuggestion }

const conversations = ref<ChatConversation[]>([])
const messages = ref<ChatMessage[]>([])
const availableUsers = ref<ChatUserSuggestion[]>([])
const selectedConversation = ref<ChatConversation | null>(null)
const messageText = ref('')
const searchText = ref('')
const activeSection = ref<ChatSection>('recent')
const conversationsLoading = ref(false)
const conversationsError = ref('')
const usersLoading = ref(false)
const usersLoadingMore = ref(false)
const usersError = ref('')
const usersPage = ref(1)
const usersHasMore = ref(false)
const creatingConversationFor = ref<string | null>(null)
const startConversationError = ref('')
const hiddenRecentConversationIds = ref<string[]>([])
const groupDialogMode = ref<'create' | 'add' | null>(null)
const groupDialogError = ref('')
const groupDialogLoading = ref(false)
const groupName = ref('')
const groupSearch = ref('')
const groupCandidates = ref<ChatUserSuggestion[]>([])
const groupSelectedIds = ref<string[]>([])
const groupCandidatesLoading = ref(false)
const groupCandidatesHasMore = ref(false)
const groupCandidatesPage = ref(0)
const groupManagementError = ref('')
const messagesLoading = ref(false)
const messagesError = ref('')
const nextCursor = ref<string | null>(null)
const sendingMessage = ref(false)
const sendError = ref('')
const mobileConversationListVisible = ref(false)
const chatSocketStatus = ref<ChatSocketStatus>('connecting')
const chatSocketError = ref('')
const chatNotice = ref('')
const readCursors = ref<Record<string, number>>({})
const pendingUnreadCounts = ref<Record<string, { count: number; revision: number }>>({})
let unreadEventRevision = 0
let conversationsRequestRevision = 0
const groupManagementOpen = ref(false)
const contextMenu = ref<{ target: ChatContextTarget; x: number; y: number } | null>(null)
const contextMenuElement = ref<HTMLElement | null>(null)
const contextMenuTrigger = ref<HTMLElement | null>(null)
const removeRecentConfirmationConversation = ref<ChatConversation | null>(null)
const removeRecentConfirmationError = ref('')
const removeRecentConfirmationLoading = ref(false)
const removeRecentConfirmationButton = ref<HTMLButtonElement | null>(null)
const removeRecentConfirmationSubmitButton = ref<HTMLButtonElement | null>(null)
const leaveConfirmationConversation = ref<ChatConversation | null>(null)
const leaveConfirmationError = ref('')
const leaveConfirmationLoading = ref(false)
const leaveConfirmationButton = ref<HTMLButtonElement | null>(null)
const leaveConfirmationSubmitButton = ref<HTMLButtonElement | null>(null)
const isCurrentUserAdmin = computed(() => selectedConversation.value?.currentUserRole === 'admin')
const sectionUnreadCounts = computed<Record<ChatSection, number>>(() => ({
  recent: conversations.value
    .filter((conversation) => !hiddenRecentConversationIds.value.includes(conversation.id))
    .reduce((sum, conversation) => sum + conversation.unreadCount, 0),
  community: conversations.value
    .filter((conversation) => conversation.category === 'community')
    .filter((conversation) => !hiddenRecentConversationIds.value.includes(conversation.id))
    .reduce((sum, conversation) => sum + conversation.unreadCount, 0),
  friend: conversations.value
    .filter((conversation) => conversation.category === 'friend')
    .filter((conversation) => !hiddenRecentConversationIds.value.includes(conversation.id))
    .reduce((sum, conversation) => sum + conversation.unreadCount, 0),
  people: 0,
}))

let conversationsController: AbortController | null = null
let messagesController: AbortController | null = null
let usersController: AbortController | null = null
let groupCandidatesController: AbortController | null = null
let messagesRequestId = 0
let usersRequestId = 0
let usersSearchTimeout: ReturnType<typeof setTimeout> | null = null
let groupSearchTimeout: ReturnType<typeof setTimeout> | null = null
const failedMessageAttempts = new Map<
  string,
  { content: string; conversationId: string; createdAt: string }
>()
const confirmedClientMessageIds = new Set<string>()
const sendingClientMessageIds = new Set<string>()
const joinedConversationIds = new Set<string>()
const joiningConversationIds = new Set<string>()
let chatSocket: Socket | null = null
let disposeChatSocket: (() => void) | null = null
let refreshChatSocketAuthentication: (() => Promise<void>) | null = null
let sessionGeneration = 0

function isConversationAccessError(error: unknown): error is ChatApiError | ChatSocketError {
  return (
    (error instanceof ChatApiError || error instanceof ChatSocketError) &&
    (error.statusCode === 403 || error.statusCode === 404)
  )
}

function clearOpenConversation(conversationId: string) {
  conversations.value = conversations.value.filter((item) => item.id !== conversationId)
  joinedConversationIds.delete(conversationId)
  joiningConversationIds.delete(conversationId)
  for (const [clientMessageId, attempt] of failedMessageAttempts) {
    if (attempt.conversationId === conversationId) {
      failedMessageAttempts.delete(clientMessageId)
    }
  }
  void leaveConversationRoom(conversationId)
  chatNotice.value = 'Você não tem mais acesso a essa conversa ou ela não existe. Atualize a lista.'
  if (selectedConversation.value?.id !== conversationId) return

  messagesController?.abort()
  messagesRequestId += 1
  selectedConversation.value = null
  messages.value = []
  nextCursor.value = null
  messagesError.value = ''
  sendError.value = ''
  groupManagementOpen.value = false
  groupDialogMode.value = null
  if (
    contextMenu.value?.target.type === 'conversation' &&
    contextMenu.value.target.conversation.id === conversationId
  ) {
    closeContextMenu()
  }
  if (removeRecentConfirmationConversation.value?.id === conversationId) {
    removeRecentConfirmationConversation.value = null
    removeRecentConfirmationError.value = ''
    removeRecentConfirmationLoading.value = false
  }
  if (leaveConfirmationConversation.value?.id === conversationId) {
    leaveConfirmationConversation.value = null
    leaveConfirmationError.value = ''
    leaveConfirmationLoading.value = false
  }
}

function handleConversationAccessError(error: unknown, conversationId: string): boolean {
  if (!isConversationAccessError(error)) return false
  clearOpenConversation(conversationId)
  return true
}

function handleSocketAuthenticationError(error: unknown): boolean {
  if (!(error instanceof ChatSocketError) || error.statusCode !== 401) return false
  void refreshChatSocketAuthentication?.()
  return true
}

function refreshConversationList() {
  chatNotice.value = ''
  void loadConversationList()
}

function clearChatState() {
  sessionGeneration += 1
  conversationsController?.abort()
  messagesController?.abort()
  usersController?.abort()
  groupCandidatesController?.abort()
  if (usersSearchTimeout) clearTimeout(usersSearchTimeout)
  if (groupSearchTimeout) clearTimeout(groupSearchTimeout)
  usersSearchTimeout = null
  groupSearchTimeout = null
  messagesRequestId += 1
  usersRequestId += 1
  conversations.value = []
  messages.value = []
  availableUsers.value = []
  hiddenRecentConversationIds.value = []
  selectedConversation.value = null
  readCursors.value = {}
  pendingUnreadCounts.value = {}
  failedMessageAttempts.clear()
  confirmedClientMessageIds.clear()
  sendingClientMessageIds.clear()
  joinedConversationIds.clear()
  joiningConversationIds.clear()
  nextCursor.value = null
  conversationsError.value = ''
  messagesError.value = ''
  usersError.value = ''
  groupDialogError.value = ''
  groupManagementError.value = ''
  conversationsLoading.value = false
  messagesLoading.value = false
  usersLoading.value = false
  usersLoadingMore.value = false
  sendingMessage.value = false
  chatNotice.value = ''
  chatSocketError.value = ''
  groupDialogMode.value = null
  groupDialogLoading.value = false
  groupDialogError.value = ''
  groupCandidates.value = []
  groupCandidatesPage.value = 0
  groupCandidatesHasMore.value = false
  groupManagementError.value = ''
  groupManagementOpen.value = false
  contextMenu.value = null
  contextMenuTrigger.value = null
  removeRecentConfirmationConversation.value = null
  removeRecentConfirmationError.value = ''
  removeRecentConfirmationLoading.value = false
  leaveConfirmationConversation.value = null
  leaveConfirmationError.value = ''
  leaveConfirmationLoading.value = false
  creatingConversationFor.value = null
  startConversationError.value = ''
  activeSection.value = 'recent'
  searchText.value = ''
}

function disposeCurrentChatSocket() {
  disposeChatSocket?.()
  disposeChatSocket = null
  chatSocket = null
  refreshChatSocketAuthentication = null
  joinedConversationIds.clear()
  joiningConversationIds.clear()
}

const sectionOptions: { label: string; value: ChatSection }[] = [
  { label: 'Recentes', value: 'recent' },
  { label: 'Comunidades', value: 'community' },
  { label: 'Amigos', value: 'friend' },
  { label: 'Pessoas', value: 'people' },
]

const visibleConversations = computed(() => {
  const search = searchText.value.toLowerCase().trim()

  return conversations.value.filter((conversation) => {
    if (hiddenRecentConversationIds.value.includes(conversation.id)) return false
    const matchesSection =
      activeSection.value === 'recent' || conversation.category === activeSection.value
    const matchesSearch = conversation.name.toLowerCase().includes(search)

    return matchesSection && matchesSearch
  })
})

const availableUsersNotInFriends = computed(() =>
  availableUsers.value.filter((user) => {
    const conversation = getUserConversation(user)
    return !conversation || hiddenRecentConversationIds.value.includes(conversation.id)
  }),
)

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

async function refreshConversationDetails(conversationId: string) {
  const requestSessionGeneration = sessionGeneration
  try {
    const conversation = await getChatConversation(conversationId)
    if (requestSessionGeneration !== sessionGeneration) return
    if (selectedConversation.value?.id === conversationId) {
      selectedConversation.value = conversation
    }
    conversations.value = mergeConversations(conversations.value, [conversation])
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    if (handleConversationAccessError(error, conversationId)) return
    if (selectedConversation.value?.id === conversationId) {
      groupManagementError.value =
        error instanceof Error ? error.message : 'Não foi possível atualizar o grupo.'
    }
  }
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const unique = new Map(
    existing.map((message) => [message.clientMessageId || message.id, message]),
  )
  for (const message of incoming) {
    unique.set(message.clientMessageId || message.id, message)
  }
  return [...unique.values()].sort(
    (first, second) =>
      (first.sequence || Number.MAX_SAFE_INTEGER) - (second.sequence || Number.MAX_SAFE_INTEGER) ||
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  )
}

function mergeConversations(
  existing: ChatConversation[],
  incoming: ChatConversation[],
): ChatConversation[] {
  const unique = new Map(existing.map((conversation) => [conversation.id, conversation]))
  for (const conversation of incoming) unique.set(conversation.id, conversation)
  return [...unique.values()].sort(
    (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  )
}

function hiddenRecentConversationsStorageKey(userId: string): string {
  return `conecta_hidden_chat_conversations:${userId}`
}

function loadHiddenRecentConversations(userId: string | null) {
  hiddenRecentConversationIds.value = []
  if (!userId) return

  const saved = localStorage.getItem(hiddenRecentConversationsStorageKey(userId))
  if (!saved) return

  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch {
    throw new Error('A preferência de conversas recentes está inválida neste navegador.')
  }
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
    throw new Error('A preferência de conversas recentes está inválida neste navegador.')
  }
  hiddenRecentConversationIds.value = [...new Set(parsed)]
}

function persistHiddenRecentConversations(conversationIds: string[]): void {
  const userId = currentUser.user?.sub
  if (!userId) throw new Error('Não foi possível identificar sua sessão.')
  localStorage.setItem(
    hiddenRecentConversationsStorageKey(userId),
    JSON.stringify([...new Set(conversationIds)]),
  )
}

function restoreRecentConversation(conversationId: string): void {
  if (!hiddenRecentConversationIds.value.includes(conversationId)) return
  const nextHiddenIds = hiddenRecentConversationIds.value.filter((id) => id !== conversationId)
  persistHiddenRecentConversations(nextHiddenIds)
  hiddenRecentConversationIds.value = nextHiddenIds
}

function getUserConversation(user: ChatUserSuggestion): ChatConversation | undefined {
  return conversations.value.find(
    (conversation) => conversation.category === 'friend' && conversation.otherUserId === user.id,
  )
}

function hasRecentConversationForUser(user: ChatUserSuggestion): boolean {
  const conversation = getUserConversation(user)
  return Boolean(conversation && !hiddenRecentConversationIds.value.includes(conversation.id))
}

function getContextTargetConversation(target: ChatContextTarget): ChatConversation | undefined {
  return target.type === 'conversation' ? target.conversation : getUserConversation(target.user)
}

function addOrReplaceMessage(message: ChatMessage) {
  if (selectedConversation.value?.id !== message.conversationId) return
  messages.value = mergeMessages(messages.value, [message])
}

function isMessageRead(message: ChatMessage): boolean {
  const conversation = selectedConversation.value
  if (!message.isMine || conversation?.category !== 'friend') return false
  const otherMember = conversation.members.find((member) => member.userId !== currentUser.user?.sub)
  if (!otherMember) return false
  return (readCursors.value[`${conversation.id}:${otherMember.userId}`] ?? 0) >= message.sequence
}

function getMessageSenderName(message: ChatMessage): string {
  if (message.isMine) return currentUser.user?.name?.trim() || 'Você'
  return (
    selectedConversation.value?.members
      .find((member) => member.userId === message.senderId)
      ?.name?.trim() || 'Usuário'
  )
}

function updateConversationSummary(value: unknown) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'string' ||
    !('updatedAt' in value) ||
    typeof value.updatedAt !== 'string'
  ) {
    return
  }
  const event = value as {
    id: string
    updatedAt: string
    lastMessage?: {
      content?: string | null
      senderId?: string | null
      sequence?: number
      createdAt?: string
    } | null
  }
  if (hiddenRecentConversationIds.value.includes(event.id)) {
    try {
      restoreRecentConversation(event.id)
    } catch (error) {
      chatNotice.value =
        error instanceof Error ? error.message : 'Não foi possível atualizar Recentes.'
    }
  }
  const conversation = conversations.value.find((item) => item.id === event.id)
  if (!conversation) {
    void loadConversationList(true)
    return
  }
  const lastMessage = event.lastMessage
  if (
    lastMessage &&
    typeof lastMessage.sequence === 'number' &&
    lastMessage.sequence > (conversation.lastMessage?.sequence ?? 0)
  ) {
    const content = lastMessage.content ?? ''
    const createdAt = lastMessage.createdAt ?? event.updatedAt
    const senderId = lastMessage.senderId ?? null
    conversations.value = mergeConversations(conversations.value, [
      {
        ...conversation,
        updatedAt: event.updatedAt,
        preview: content,
        lastMessage: {
          content,
          senderId,
          sequence: lastMessage.sequence,
          createdAt,
        },
      },
    ])
  }
}

function applyUnreadUpdate(value: unknown) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('conversationId' in value) ||
    typeof value.conversationId !== 'string' ||
    !('unreadCount' in value) ||
    typeof value.unreadCount !== 'number' ||
    !Number.isFinite(value.unreadCount)
  ) {
    return
  }
  applyUnreadCount(value.conversationId, value.unreadCount)
}

function handleSocketMessage(value: unknown) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('conversationId' in value) ||
    typeof value.conversationId !== 'string'
  ) {
    return
  }

  try {
    const message = normalizeChatMessage(value, value.conversationId)
    const failedAttempt = failedMessageAttempts.get(message.clientMessageId)
    if (failedAttempt) {
      failedMessageAttempts.delete(message.clientMessageId)
      if (
        message.conversationId === selectedConversation.value?.id &&
        messageText.value.trim() === failedAttempt.content
      ) {
        messageText.value = ''
      }
    } else if (sendingClientMessageIds.has(message.clientMessageId)) {
      confirmedClientMessageIds.add(message.clientMessageId)
    }
    addOrReplaceMessage(message)
    updateConversationSummary({
      id: message.conversationId,
      updatedAt: message.createdAt,
      lastMessage: {
        content: message.content,
        senderId: message.senderId,
        sequence: message.sequence,
        createdAt: message.createdAt,
      },
    })
    if (message.conversationId === selectedConversation.value?.id && !message.isMine) {
      void markCurrentConversationRead(message.conversationId)
    }
  } catch (error) {
    chatSocketError.value =
      error instanceof Error ? error.message : 'A mensagem recebida é inválida.'
  }
}

async function joinConversationRoom(conversationId: string) {
  if (
    !chatSocket?.connected ||
    joinedConversationIds.has(conversationId) ||
    joiningConversationIds.has(conversationId)
  ) {
    return
  }
  joiningConversationIds.add(conversationId)
  try {
    await emitChatSocketAck(chatSocket, 'chat:conversation:join', { conversationId })
    joinedConversationIds.add(conversationId)
  } catch (error) {
    if (handleSocketAuthenticationError(error)) return
    if (handleConversationAccessError(error, conversationId)) return
    chatSocketError.value =
      error instanceof Error ? error.message : 'Não foi possível entrar na conversa.'
  } finally {
    joiningConversationIds.delete(conversationId)
  }
}

async function leaveConversationRoom(conversationId: string) {
  if (!chatSocket?.connected) return
  try {
    await emitChatSocketAck(chatSocket, 'chat:conversation:leave', { conversationId })
    joinedConversationIds.delete(conversationId)
  } catch {
    // The server removes the socket from its rooms on disconnect.
  }
}

async function markCurrentConversationRead(conversationId: string) {
  const requestSessionGeneration = sessionGeneration
  const applyRead = (result: {
    conversationId: string
    lastReadSequence: number
    unreadCount: number
  }) => {
    readCursors.value = {
      ...readCursors.value,
      [`${result.conversationId}:${currentUser.user?.sub ?? ''}`]: result.lastReadSequence,
    }
    applyUnreadCount(result.conversationId, result.unreadCount)
  }

  try {
    if (chatSocket?.connected) {
      const result = await emitChatSocketAck<{
        conversationId: string
        lastReadSequence: number
        unreadCount: number
      }>(chatSocket, 'chat:message:read', { conversationId })
      if (requestSessionGeneration === sessionGeneration) applyRead(result)
    } else {
      const result = await markChatConversationRead(conversationId)
      if (requestSessionGeneration === sessionGeneration) applyRead(result)
    }
  } catch (error) {
    if (handleSocketAuthenticationError(error)) return
    try {
      const result = await markChatConversationRead(conversationId)
      if (requestSessionGeneration !== sessionGeneration) return
      applyRead(result)
    } catch (httpError) {
      if (requestSessionGeneration !== sessionGeneration) return
      if (handleConversationAccessError(httpError, conversationId)) return
      chatSocketError.value =
        httpError instanceof Error
          ? httpError.message
          : error instanceof Error
            ? error.message
            : 'Não foi possível atualizar a leitura.'
    }
  }
}

function applyUnreadCount(conversationId: string, unreadCount: number) {
  const count = Math.max(0, Math.floor(unreadCount))
  const revision = ++unreadEventRevision
  pendingUnreadCounts.value = {
    ...pendingUnreadCounts.value,
    [conversationId]: { count, revision },
  }
  conversations.value = conversations.value.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, unreadCount: count } : conversation,
  )
}

async function onSocketConnected() {
  chatSocketError.value = ''
  joinedConversationIds.clear()
  joiningConversationIds.clear()
  await loadConversationList(true)
  if (selectedConversation.value) {
    await joinConversationRoom(selectedConversation.value.id)
    await loadMessages(selectedConversation.value.id)
  }
}

function initializeChatSocket() {
  if (chatSocket) return
  if (!currentUser.user?.sub) {
    chatSocketStatus.value = 'disconnected'
    return
  }
  try {
    const connection = createChatSocket(
      (status) => {
        chatSocketStatus.value = status
        if (status === 'connected') void onSocketConnected()
      },
      (message) => {
        chatSocketError.value = message
      },
    )
    chatSocket = connection.socket
    disposeChatSocket = connection.dispose
    refreshChatSocketAuthentication = connection.refreshAuthentication
    chatSocket.on('chat:message:new', handleSocketMessage)
    chatSocket.on('chat:conversation:update', updateConversationSummary)
    chatSocket.on('chat:unread:update', applyUnreadUpdate)
    chatSocket.on('chat:message:read', (value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'conversationId' in value &&
        typeof value.conversationId === 'string' &&
        'userId' in value &&
        typeof value.userId === 'string' &&
        'lastReadSequence' in value &&
        typeof value.lastReadSequence === 'number'
      ) {
        readCursors.value = {
          ...readCursors.value,
          [`${value.conversationId}:${value.userId}`]: value.lastReadSequence,
        }
      }
    })
    chatSocket.on('chat:conversation:available', () => {
      void loadConversationList(true)
    })
    chatSocket.on(
      'chat:conversation:members',
      (value: { conversationId?: string; memberIds?: string[] }) => {
        if (!value.conversationId || !Array.isArray(value.memberIds)) return
        if (selectedConversation.value?.id === value.conversationId) {
          void refreshConversationDetails(value.conversationId)
        }
        void loadConversationList(true)
      },
    )
    chatSocket.on('chat:conversation:removed', (value: { conversationId?: string }) => {
      if (!value.conversationId) return
      clearOpenConversation(value.conversationId)
    })
  } catch (error) {
    chatSocketStatus.value = 'disconnected'
    chatSocketError.value =
      error instanceof Error ? error.message : 'Não foi possível iniciar o chat em tempo real.'
  }
}

function retryChatSocket() {
  if (chatSocket?.connected) return
  disposeCurrentChatSocket()
  initializeChatSocket()
}

function closeContextMenu(restoreFocus = false) {
  const trigger = contextMenuTrigger.value
  contextMenu.value = null
  contextMenuTrigger.value = null
  if (restoreFocus) void nextTick(() => trigger?.focus())
}

function openContextMenu(target: ChatContextTarget, x: number, y: number, trigger: HTMLElement) {
  contextMenuTrigger.value = trigger
  contextMenu.value = { target, x, y }
  void nextTick(() => {
    const menu = contextMenuElement.value
    if (!menu || !contextMenu.value) return
    const margin = 8
    const maxX = Math.max(margin, window.innerWidth - menu.offsetWidth - margin)
    const maxY = Math.max(margin, window.innerHeight - menu.offsetHeight - margin)
    contextMenu.value.x = Math.min(Math.max(x, margin), maxX)
    contextMenu.value.y = Math.min(Math.max(y, margin), maxY)
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  })
}

function isContextMenuOpen(target: ChatContextTarget): boolean {
  const openTarget = contextMenu.value?.target
  if (!openTarget || openTarget.type !== target.type) return false
  return openTarget.type === 'user'
    ? target.type === 'user' && openTarget.user.id === target.user.id
    : target.type === 'conversation' && openTarget.conversation.id === target.conversation.id
}

function handleContextMenu(event: MouseEvent, target: ChatContextTarget) {
  const conversation = getContextTargetConversation(target)
  if (!conversation || hiddenRecentConversationIds.value.includes(conversation.id)) return
  event.preventDefault()
  event.stopPropagation()
  openContextMenu(target, event.clientX, event.clientY, event.currentTarget as HTMLElement)
}

function handleContextMenuButton(event: MouseEvent, target: ChatContextTarget) {
  const conversation = getContextTargetConversation(target)
  if (!conversation || hiddenRecentConversationIds.value.includes(conversation.id)) return
  event.stopPropagation()
  const trigger = event.currentTarget as HTMLElement
  const bounds = trigger.getBoundingClientRect()
  openContextMenu(target, bounds.left, bounds.bottom + 4, trigger)
}

function handleContextMenuKeyboard(event: KeyboardEvent, target: ChatContextTarget) {
  if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
  const conversation = getContextTargetConversation(target)
  if (!conversation || hiddenRecentConversationIds.value.includes(conversation.id)) return
  event.preventDefault()
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect()
  openContextMenu(target, bounds.left, bounds.bottom + 4, event.currentTarget as HTMLElement)
}

function handleContextMenuKeydown(event: KeyboardEvent) {
  const items = Array.from(
    contextMenuElement.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
  ).filter((item) => !item.disabled)
  if (!items.length) return
  const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)
  let nextIndex: number | null = null

  if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
  if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = items.length - 1
  if (nextIndex !== null) {
    event.preventDefault()
    items[nextIndex]?.focus()
  }
}

function handleContextMenuOutside(event: PointerEvent) {
  if (!contextMenu.value || contextMenuElement.value?.contains(event.target as Node)) return
  closeContextMenu()
}

function handleContextMenuViewportChange() {
  closeContextMenu()
}

function handleContextMenuEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (removeRecentConfirmationConversation.value) {
    if (removeRecentConfirmationLoading.value) return
    closeRemoveRecentConfirmation()
    return
  }
  if (leaveConfirmationConversation.value) {
    if (leaveConfirmationLoading.value) return
    leaveConfirmationConversation.value = null
    leaveConfirmationError.value = ''
    return
  }
  if (contextMenu.value) {
    event.preventDefault()
    closeContextMenu(true)
  }
}

function openLeaveConfirmation(conversation: ChatConversation) {
  closeContextMenu()
  leaveConfirmationConversation.value = conversation
  leaveConfirmationError.value = ''
  void nextTick(() => leaveConfirmationButton.value?.focus())
}

function requestRemoveFromRecent() {
  const target = contextMenu.value?.target
  const conversation = target ? getContextTargetConversation(target) : undefined
  closeContextMenu()
  if (!conversation) return
  removeRecentConfirmationConversation.value = conversation
  removeRecentConfirmationError.value = ''
  void nextTick(() => removeRecentConfirmationButton.value?.focus())
}

function closeLeaveConfirmation() {
  if (leaveConfirmationLoading.value) return
  leaveConfirmationConversation.value = null
  leaveConfirmationError.value = ''
}

function closeRemoveRecentConfirmation() {
  if (removeRecentConfirmationLoading.value) return
  removeRecentConfirmationConversation.value = null
  removeRecentConfirmationError.value = ''
}

async function confirmRemoveFromRecent() {
  const conversation = removeRecentConfirmationConversation.value
  if (!conversation || removeRecentConfirmationLoading.value) return
  removeRecentConfirmationLoading.value = true
  removeRecentConfirmationError.value = ''

  try {
    const nextHiddenIds = [...hiddenRecentConversationIds.value, conversation.id]
    persistHiddenRecentConversations(nextHiddenIds)
    hiddenRecentConversationIds.value = [...new Set(nextHiddenIds)]
    if (selectedConversation.value?.id === conversation.id) {
      await leaveConversationRoom(conversation.id)
      selectedConversation.value = null
      messagesController?.abort()
      messagesRequestId += 1
      messages.value = []
      nextCursor.value = null
      messagesError.value = ''
      sendError.value = ''
      groupManagementOpen.value = false
    }
    removeRecentConfirmationConversation.value = null
    chatNotice.value =
      'Conversa removida de Recentes neste navegador. O histórico e as mensagens continuam salvos.'
  } catch (error) {
    removeRecentConfirmationError.value =
      error instanceof Error ? error.message : 'Não foi possível remover a conversa de Recentes.'
  } finally {
    removeRecentConfirmationLoading.value = false
  }
}

function handleRemoveRecentDialogKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const cancelButton = removeRecentConfirmationButton.value
  const submitButton = removeRecentConfirmationSubmitButton.value
  if (!cancelButton || !submitButton) return

  if (event.shiftKey && document.activeElement === cancelButton) {
    event.preventDefault()
    submitButton.focus()
  } else if (!event.shiftKey && document.activeElement === submitButton) {
    event.preventDefault()
    cancelButton.focus()
  }
}

function handleLeaveDialogKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const cancelButton = leaveConfirmationButton.value
  const submitButton = leaveConfirmationSubmitButton.value
  if (!cancelButton || !submitButton) return

  if (event.shiftKey && document.activeElement === cancelButton) {
    event.preventDefault()
    submitButton.focus()
  } else if (!event.shiftKey && document.activeElement === submitButton) {
    event.preventDefault()
    cancelButton.focus()
  }
}

async function confirmLeaveConversation() {
  const conversation = leaveConfirmationConversation.value
  if (!conversation || leaveConfirmationLoading.value) return
  leaveConfirmationLoading.value = true
  leaveConfirmationError.value = ''
  const requestSessionGeneration = sessionGeneration

  try {
    await leaveChatGroup(conversation.id)
    if (requestSessionGeneration !== sessionGeneration) return
    await leaveConversationRoom(conversation.id)
    conversations.value = conversations.value.filter((item) => item.id !== conversation.id)
    if (selectedConversation.value?.id === conversation.id) {
      messagesController?.abort()
      messagesRequestId += 1
      selectedConversation.value = null
      messages.value = []
      nextCursor.value = null
      messagesError.value = ''
      sendError.value = ''
      groupManagementOpen.value = false
    }
    leaveConfirmationConversation.value = null
    chatNotice.value = `Você saiu do grupo “${conversation.name}”. A conversa e as mensagens não foram apagadas.`
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    if (handleConversationAccessError(error, conversation.id)) {
      leaveConfirmationConversation.value = null
      return
    }
    leaveConfirmationError.value =
      error instanceof Error ? error.message : 'Não foi possível sair do grupo.'
  } finally {
    if (requestSessionGeneration === sessionGeneration) {
      leaveConfirmationLoading.value = false
    }
  }
}

function selectSection(section: ChatSection) {
  closeContextMenu()
  activeSection.value = section
  startConversationError.value = ''

  if (section === 'people') {
    searchText.value = ''
    void loadPeople(true)
    return
  }

  if (usersSearchTimeout) {
    clearTimeout(usersSearchTimeout)
    usersSearchTimeout = null
  }
  usersController?.abort()
  usersController = null
  usersLoading.value = false
  usersLoadingMore.value = false
}

async function loadPeople(reset = true) {
  if (reset) {
    usersController?.abort()
  } else if (usersLoading.value || usersLoadingMore.value || !usersHasMore.value) {
    return
  }

  const controller = new AbortController()
  usersController = controller
  const requestId = ++usersRequestId
  const page = reset ? 1 : usersPage.value + 1
  usersError.value = ''
  usersLoading.value = reset
  usersLoadingMore.value = !reset

  try {
    const result = await searchChatUsers(searchText.value, page, 24, controller.signal)
    if (
      controller.signal.aborted ||
      requestId !== usersRequestId ||
      activeSection.value !== 'people'
    ) {
      return
    }

    availableUsers.value = reset
      ? result.users
      : [
          ...availableUsers.value,
          ...result.users.filter(
            (user) => !availableUsers.value.some((existing) => existing.id === user.id),
          ),
        ]
    usersPage.value = result.page
    usersHasMore.value = result.hasMore
  } catch (error) {
    if (!controller.signal.aborted && requestId === usersRequestId) {
      usersError.value =
        error instanceof Error ? error.message : 'Não foi possível carregar as pessoas.'
    }
  } finally {
    if (usersController === controller) {
      usersLoading.value = false
      usersLoadingMore.value = false
      usersController = null
    }
  }
}

function handleSearchInput() {
  if (activeSection.value !== 'people') return
  if (usersSearchTimeout) clearTimeout(usersSearchTimeout)
  usersController?.abort()
  usersSearchTimeout = setTimeout(() => {
    usersSearchTimeout = null
    void loadPeople(true)
  }, 300)
}

async function loadConversationList(preserveSelection = false) {
  conversationsController?.abort()
  const controller = new AbortController()
  conversationsController = controller
  const requestRevision = ++conversationsRequestRevision
  const unreadRevisionAtRequestStart = unreadEventRevision
  conversationsLoading.value = true
  conversationsError.value = ''

  try {
    const result = await listChatConversations(controller.signal)
    if (controller.signal.aborted) return

    const pending = pendingUnreadCounts.value
    conversations.value = result.map((conversation) => {
      const unreadUpdate = pending[conversation.id]
      return unreadUpdate && unreadUpdate.revision > unreadRevisionAtRequestStart
        ? { ...conversation, unreadCount: unreadUpdate.count }
        : conversation
    })
    if (requestRevision === conversationsRequestRevision) {
      const nextPending = { ...pendingUnreadCounts.value }
      for (const [conversationId, unreadUpdate] of Object.entries(nextPending)) {
        if (unreadUpdate.revision <= unreadEventRevision) delete nextPending[conversationId]
      }
      pendingUnreadCounts.value = nextPending
    }
    if (chatSocket?.connected) {
      for (const conversation of result) void joinConversationRoom(conversation.id)
    }
    if (
      preserveSelection &&
      selectedConversation.value &&
      result.some(
        (conversation) =>
          conversation.id === selectedConversation.value?.id &&
          !hiddenRecentConversationIds.value.includes(conversation.id),
      )
    ) {
      selectedConversation.value =
        result.find((conversation) => conversation.id === selectedConversation.value?.id) ?? null
    } else if (
      result.some((conversation) => !hiddenRecentConversationIds.value.includes(conversation.id))
    ) {
      const firstVisibleConversation = result.find(
        (conversation) => !hiddenRecentConversationIds.value.includes(conversation.id),
      )
      if (firstVisibleConversation) selectConversation(firstVisibleConversation)
    } else {
      selectedConversation.value = null
      messages.value = []
      nextCursor.value = null
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      if (error instanceof ChatApiError && (error.statusCode === 403 || error.statusCode === 404)) {
        for (const conversation of conversations.value) {
          void leaveConversationRoom(conversation.id)
        }
        conversations.value = []
        selectedConversation.value = null
        messages.value = []
        nextCursor.value = null
        messagesError.value = ''
        groupManagementOpen.value = false
        messagesController?.abort()
      }
      conversationsError.value =
        error instanceof Error ? error.message : 'Não foi possível carregar as conversas.'
    }
  } finally {
    if (conversationsController === controller) {
      conversationsLoading.value = false
      conversationsController = null
    }
  }
}

async function loadMessages(conversationId: string, loadOlder = false) {
  if (loadOlder && !nextCursor.value) return

  messagesController?.abort()
  const controller = new AbortController()
  messagesController = controller
  const requestId = ++messagesRequestId
  messagesLoading.value = true
  messagesError.value = ''

  try {
    const page = await listChatMessages(conversationId, {
      cursor: loadOlder ? (nextCursor.value ?? undefined) : undefined,
      signal: controller.signal,
    })
    if (
      controller.signal.aborted ||
      requestId !== messagesRequestId ||
      selectedConversation.value?.id !== conversationId
    ) {
      return
    }

    messages.value = mergeMessages(messages.value, page.messages)
    nextCursor.value = page.nextCursor
    if (!loadOlder) void markCurrentConversationRead(conversationId)
  } catch (error) {
    if (!controller.signal.aborted && requestId === messagesRequestId) {
      if (handleConversationAccessError(error, conversationId)) return
      messagesError.value =
        error instanceof Error ? error.message : 'Não foi possível carregar as mensagens.'
    }
  } finally {
    if (messagesController === controller) {
      messagesLoading.value = false
      messagesController = null
    }
  }
}

function selectConversation(conversation: ChatConversation) {
  closeContextMenu()
  closeRemoveRecentConfirmation()
  const previousConversationId = selectedConversation.value?.id
  if (previousConversationId && previousConversationId !== conversation.id) {
    void leaveConversationRoom(previousConversationId)
  }
  selectedConversation.value = conversation
  messages.value = []
  nextCursor.value = null
  messagesError.value = ''
  sendError.value = ''
  groupManagementOpen.value = false
  groupManagementError.value = ''
  chatNotice.value = ''
  mobileConversationListVisible.value = false
  for (const [clientMessageId, attempt] of failedMessageAttempts) {
    if (attempt.conversationId !== conversation.id) continue
    messages.value = mergeMessages(messages.value, [
      {
        id: clientMessageId,
        clientMessageId,
        conversationId: conversation.id,
        senderId: currentUser.user?.sub ?? '',
        sequence: Number.MAX_SAFE_INTEGER,
        content: attempt.content,
        createdAt: attempt.createdAt,
        isMine: true,
        deliveryStatus: 'failed',
      },
    ])
  }
  void joinConversationRoom(conversation.id)
  void refreshConversationDetails(conversation.id)
  void loadMessages(conversation.id)
}

async function sendMessage(retryClientMessageId?: string) {
  const text = messageText.value.trim()
  const conversation = selectedConversation.value
  if (!text || !conversation || sendingMessage.value) return

  sendingMessage.value = true
  sendError.value = ''
  const requestSessionGeneration = sessionGeneration
  const requestUserId = currentUser.user?.sub ?? ''
  const existingFailedAttempt =
    retryClientMessageId === undefined
      ? [...failedMessageAttempts].find(
          ([, attempt]) => attempt.conversationId === conversation.id && attempt.content === text,
        )
      : undefined
  let clientMessageId: string
  try {
    clientMessageId = retryClientMessageId ?? existingFailedAttempt?.[0] ?? crypto.randomUUID()
  } catch {
    sendingMessage.value = false
    sendError.value = 'Não foi possível gerar um identificador seguro para a mensagem.'
    return
  }
  const optimisticMessage: ChatMessage = {
    id: clientMessageId,
    clientMessageId,
    conversationId: conversation.id,
    senderId: requestUserId,
    sequence: Number.MAX_SAFE_INTEGER,
    content: text,
    createdAt: failedMessageAttempts.get(clientMessageId)?.createdAt ?? new Date().toISOString(),
    isMine: true,
    deliveryStatus: 'sending',
  }
  addOrReplaceMessage(optimisticMessage)
  sendingClientMessageIds.add(clientMessageId)
  try {
    if (!chatSocket?.connected) {
      throw new Error('Sem conexão com o chat. Tente novamente quando reconectar.')
    }
    const result = await emitChatSocketAck<unknown>(chatSocket, 'chat:message:send', {
      conversationId: conversation.id,
      clientMessageId,
      content: text,
    })
    if (requestSessionGeneration !== sessionGeneration) return
    const message = normalizeChatMessage(result, conversation.id)
    failedMessageAttempts.delete(clientMessageId)
    confirmedClientMessageIds.delete(clientMessageId)
    addOrReplaceMessage(message)
    updateConversationSummary({
      id: conversation.id,
      updatedAt: message.createdAt,
      lastMessage: {
        content: message.content,
        senderId: message.senderId,
        sequence: message.sequence,
        createdAt: message.createdAt,
      },
    })
    if (selectedConversation.value?.id === conversation.id && messageText.value.trim() === text) {
      messageText.value = ''
    }
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    handleSocketAuthenticationError(error)
    if (confirmedClientMessageIds.delete(clientMessageId)) {
      failedMessageAttempts.delete(clientMessageId)
      if (selectedConversation.value?.id === conversation.id && messageText.value.trim() === text) {
        messageText.value = ''
      }
      return
    }
    const confirmedMessage = messages.value.find(
      (message) => message.clientMessageId === clientMessageId,
    )
    if (
      confirmedMessage &&
      confirmedMessage.id !== clientMessageId &&
      confirmedMessage.sequence < Number.MAX_SAFE_INTEGER
    ) {
      failedMessageAttempts.delete(clientMessageId)
      if (selectedConversation.value?.id === conversation.id && messageText.value.trim() === text) {
        messageText.value = ''
      }
      return
    }
    if (handleConversationAccessError(error, conversation.id)) {
      messages.value = messages.value.filter(
        (message) => message.clientMessageId !== clientMessageId,
      )
      return
    }
    failedMessageAttempts.set(clientMessageId, {
      content: text,
      conversationId: conversation.id,
      createdAt: optimisticMessage.createdAt,
    })
    messages.value = messages.value.map((message) =>
      message.clientMessageId === clientMessageId
        ? { ...message, deliveryStatus: 'failed' }
        : message,
    )
    sendError.value = error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.'
  } finally {
    sendingClientMessageIds.delete(clientMessageId)
    if (requestSessionGeneration === sessionGeneration) {
      sendingMessage.value = false
    }
  }
}

function retryMessage(message: ChatMessage) {
  const attempt = failedMessageAttempts.get(message.clientMessageId)
  if (
    !attempt ||
    attempt.conversationId !== selectedConversation.value?.id ||
    sendingMessage.value
  ) {
    return
  }
  messageText.value = attempt.content
  void sendMessage(message.clientMessageId)
}

async function startDirectConversation(user: ChatUserSuggestion) {
  if (creatingConversationFor.value) return

  const existingConversation = conversations.value.find(
    (conversation) => conversation.otherUserId === user.id,
  )
  if (existingConversation) {
    try {
      restoreRecentConversation(existingConversation.id)
    } catch (error) {
      startConversationError.value =
        error instanceof Error ? error.message : 'Não foi possível restaurar a conversa.'
      return
    }
    activeSection.value = 'recent'
    searchText.value = ''
    selectConversation(existingConversation)
    return
  }

  creatingConversationFor.value = user.id
  startConversationError.value = ''
  const requestSessionGeneration = sessionGeneration
  try {
    const conversation = await createOrGetDirectConversation(user.id)
    if (requestSessionGeneration !== sessionGeneration) return
    conversations.value = mergeConversations(conversations.value, [conversation])
    activeSection.value = 'recent'
    searchText.value = ''
    selectConversation(conversation)
    if (chatSocket?.connected) {
      await joinConversationRoom(conversation.id)
    }
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    startConversationError.value =
      error instanceof Error ? error.message : 'Não foi possível iniciar a conversa.'
  } finally {
    if (requestSessionGeneration === sessionGeneration) {
      creatingConversationFor.value = null
    }
  }
}

function openGroupDialog(mode: 'create' | 'add') {
  if (
    mode === 'add' &&
    (selectedConversation.value?.category !== 'community' || !isCurrentUserAdmin.value)
  ) {
    return
  }
  groupDialogMode.value = mode
  groupDialogError.value = ''
  groupName.value = ''
  groupSearch.value = ''
  groupSelectedIds.value = []
  void loadGroupCandidates(true)
}

function closeGroupDialog() {
  groupDialogMode.value = null
  groupCandidatesController?.abort()
}

async function loadGroupCandidates(reset = true) {
  if (!reset && (groupCandidatesLoading.value || !groupCandidatesHasMore.value)) return
  groupCandidatesController?.abort()
  if (reset) groupCandidates.value = []
  const controller = new AbortController()
  groupCandidatesController = controller
  const page = reset ? 1 : groupCandidatesPage.value + 1
  groupCandidatesLoading.value = true
  groupDialogError.value = ''
  try {
    const result = await searchChatUsers(groupSearch.value, page, 24, controller.signal)
    if (controller.signal.aborted || groupDialogMode.value === null) return
    const excludedIds = new Set(
      groupDialogMode.value === 'add'
        ? (selectedConversation.value?.members.map((member) => member.userId) ?? [])
        : [],
    )
    const users = result.users.filter((user) => !excludedIds.has(user.id))
    groupCandidates.value = reset
      ? users
      : [
          ...groupCandidates.value,
          ...users.filter(
            (user) => !groupCandidates.value.some((existing) => existing.id === user.id),
          ),
        ]
    groupCandidatesPage.value = result.page
    groupCandidatesHasMore.value = result.hasMore
  } catch (error) {
    if (!controller.signal.aborted) {
      groupDialogError.value =
        error instanceof Error ? error.message : 'Não foi possível carregar as pessoas.'
    }
  } finally {
    if (groupCandidatesController === controller) {
      groupCandidatesController = null
      groupCandidatesLoading.value = false
    }
  }
}

function handleGroupSearchInput() {
  if (groupSearchTimeout) clearTimeout(groupSearchTimeout)
  groupCandidatesController?.abort()
  groupSearchTimeout = setTimeout(() => {
    groupSearchTimeout = null
    void loadGroupCandidates(true)
  }, 300)
}

async function submitGroupDialog() {
  if (!groupDialogMode.value || groupDialogLoading.value) return
  if (groupDialogMode.value === 'create' && !groupName.value.trim()) {
    groupDialogError.value = 'Informe o nome do grupo.'
    return
  }
  if (groupSelectedIds.value.length === 0) {
    groupDialogError.value = 'Selecione pelo menos uma pessoa.'
    return
  }
  if (groupDialogMode.value === 'create' && groupSelectedIds.value.length > 49) {
    groupDialogError.value = 'Um grupo pode ter no máximo 49 pessoas além de você.'
    return
  }

  groupDialogLoading.value = true
  groupDialogError.value = ''
  const requestSessionGeneration = sessionGeneration
  const affectedConversationId =
    groupDialogMode.value === 'add' ? selectedConversation.value?.id : undefined
  try {
    if (groupDialogMode.value === 'create') {
      const conversation = await createChatGroup(groupName.value.trim(), groupSelectedIds.value)
      if (requestSessionGeneration !== sessionGeneration) return
      conversations.value = mergeConversations(conversations.value, [conversation])
      activeSection.value = 'recent'
      closeGroupDialog()
      selectConversation(conversation)
    } else if (selectedConversation.value) {
      const conversationId = selectedConversation.value.id
      await addChatMembers(conversationId, groupSelectedIds.value)
      if (requestSessionGeneration !== sessionGeneration) return
      await refreshConversationDetails(conversationId)
      await loadConversationList(true)
      closeGroupDialog()
    }
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    if (affectedConversationId && error instanceof ChatApiError && error.statusCode === 404) {
      await refreshConversationDetails(affectedConversationId)
      if (selectedConversation.value?.id !== affectedConversationId) return
    }
    groupDialogError.value =
      error instanceof Error ? error.message : 'Não foi possível salvar o grupo.'
  } finally {
    if (requestSessionGeneration === sessionGeneration) {
      groupDialogLoading.value = false
    }
  }
}

async function removeGroupMember(member: ChatMember) {
  const conversation = selectedConversation.value
  if (!conversation || !isCurrentUserAdmin.value || member.userId === currentUser.user?.sub) {
    return
  }
  groupManagementError.value = ''
  const requestSessionGeneration = sessionGeneration
  try {
    await removeChatMember(conversation.id, member.userId)
    if (requestSessionGeneration !== sessionGeneration) return
    await refreshConversationDetails(conversation.id)
    await loadConversationList(true)
  } catch (error) {
    if (requestSessionGeneration !== sessionGeneration) return
    if (error instanceof ChatApiError && error.statusCode === 404) {
      await refreshConversationDetails(conversation.id)
      if (selectedConversation.value?.id !== conversation.id) return
    }
    groupManagementError.value =
      error instanceof Error ? error.message : 'Não foi possível remover esse participante.'
  }
}

function requestLeaveCurrentGroup() {
  const conversation = selectedConversation.value
  if (conversation?.category === 'community') openLeaveConfirmation(conversation)
}

watch(
  () => currentUser.user?.sub ?? null,
  (userId, previousUserId) => {
    if (userId === previousUserId) return
    clearChatState()
    try {
      loadHiddenRecentConversations(userId)
    } catch (error) {
      chatNotice.value =
        error instanceof Error ? error.message : 'Não foi possível carregar Recentes.'
    }
    disposeCurrentChatSocket()
    if (userId) {
      chatSocketStatus.value = 'connecting'
      void loadConversationList()
      initializeChatSocket()
    } else {
      chatSocketStatus.value = 'disconnected'
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  try {
    loadHiddenRecentConversations(currentUser.user?.sub ?? null)
  } catch (error) {
    chatNotice.value =
      error instanceof Error ? error.message : 'Não foi possível carregar Recentes.'
  }
  document.addEventListener('pointerdown', handleContextMenuOutside)
  document.addEventListener('keydown', handleContextMenuEscape)
  window.addEventListener('resize', handleContextMenuViewportChange)
  window.addEventListener('scroll', handleContextMenuViewportChange, true)
  void loadConversationList()
  initializeChatSocket()
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleContextMenuOutside)
  document.removeEventListener('keydown', handleContextMenuEscape)
  window.removeEventListener('resize', handleContextMenuViewportChange)
  window.removeEventListener('scroll', handleContextMenuViewportChange, true)
  conversationsController?.abort()
  messagesController?.abort()
  usersController?.abort()
  groupCandidatesController?.abort()
  if (usersSearchTimeout) clearTimeout(usersSearchTimeout)
  if (groupSearchTimeout) clearTimeout(groupSearchTimeout)
  disposeCurrentChatSocket()
})
</script>

<template>
  <section class="chat-page relative mx-auto flex h-screen max-w-full min-h-[560px] bg-white">
    <aside
      class="chat-list flex w-[330px] shrink-0 flex-col border-r border-[#e8ebf0] bg-[#fbfcfd] max-[850px]:w-[285px]"
      :class="{ 'max-[620px]:hidden': !mobileConversationListVisible }"
    >
      <div class="border-b border-[#e8ebf0] px-6 py-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="min-w-0">
            <p class="m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-[#8b94a6]">
              Mensagens
            </p>
            <h1
              class="mt-1 font-['Space_Grotesk',sans-serif] text-xl font-semibold tracking-[-.5px]"
            >
              {{ sectionOptions.find((section) => section.value === activeSection)?.label }}
            </h1>
          </div>
          <button
            class="grid size-9 shrink-0 place-items-center rounded-lg border-0 bg-[#e9eefb] text-[#253b73] transition-colors hover:bg-[#dfe6f8]"
            type="button"
            aria-label="Criar grupo"
            title="Criar grupo"
            @click="openGroupDialog('create')"
          >
            <font-awesome-icon :icon="faUsers" class="text-xs" />
          </button>
        </div>
        <div class="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-[#f0f2f6] p-1">
          <button
            v-for="section in sectionOptions"
            :key="section.value"
            class="rounded-md border-0 px-1 py-2 text-[9px] font-bold text-[#8b94a6] transition-colors"
            :class="
              activeSection === section.value
                ? 'bg-white text-[#253b73] shadow-sm'
                : 'bg-transparent'
            "
            type="button"
            @click="selectSection(section.value)"
          >
            {{ section.label }}
            <span
              v-if="sectionUnreadCounts[section.value] > 0"
              class="ml-1 inline-grid min-w-4 place-items-center rounded-full bg-[#253b73] px-1 text-[8px] leading-4 text-white"
              :aria-label="`${sectionUnreadCounts[section.value]} mensagens não lidas`"
            >
              {{
                sectionUnreadCounts[section.value] > 99 ? '99+' : sectionUnreadCounts[section.value]
              }}
            </span>
          </button>
        </div>
        <label
          class="flex h-9 items-center gap-2 rounded-lg border border-[#e7eaf0] bg-white px-3 text-[#929aaa]"
        >
          <font-awesome-icon :icon="faSearch" class="text-xs" />
          <input
            v-model="searchText"
            class="w-full border-0 bg-transparent text-xs text-[#172238] outline-none placeholder:text-[#a3aab6]"
            type="search"
            :placeholder="activeSection === 'people' ? 'Buscar pessoa' : 'Buscar conversa'"
            :aria-label="activeSection === 'people' ? 'Buscar pessoa' : 'Buscar conversa'"
            @input="handleSearchInput"
          />
        </label>
      </div>

      <div v-if="activeSection === 'people'" class="flex-1 overflow-y-auto p-3">
        <p v-if="usersLoading" class="px-3 py-8 text-center text-xs text-[#929aaa]">
          Carregando pessoas...
        </p>
        <p v-else-if="usersError" role="alert" class="px-3 py-8 text-center text-xs text-red-600">
          {{ usersError }}
          <button class="ml-1 underline" type="button" @click="loadPeople(true)">
            Tentar novamente
          </button>
        </p>
        <template v-else>
          <div
            v-for="user in availableUsersNotInFriends"
            :key="user.id"
            class="group flex w-full items-center gap-1 rounded-xl p-1 transition-colors hover:bg-[#f0f3fa]"
            @contextmenu="handleContextMenu($event, { type: 'user', user })"
            @keydown="handleContextMenuKeyboard($event, { type: 'user', user })"
          >
            <button
              class="flex min-w-0 flex-1 items-center gap-3 rounded-lg border-0 bg-transparent p-2 text-left transition-colors hover:bg-[#f0f3fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad] disabled:cursor-wait disabled:opacity-60"
              type="button"
              :aria-label="`Iniciar conversa com ${user.name}`"
              :disabled="creatingConversationFor !== null"
              @click="startDirectConversation(user)"
            >
              <span
                class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9eefb] text-[10px] font-bold text-[#536bad]"
              >
                <img
                  v-if="user.image"
                  :src="user.image"
                  :alt="`Foto de ${user.name}`"
                  class="size-full object-cover"
                />
                <span v-else>{{ getInitials(user.name) }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <strong class="block truncate text-xs text-[#172238]">{{ user.name }}</strong>
                <span class="mt-1 block truncate text-[10px] text-[#8c96a7]">
                  {{
                    creatingConversationFor === user.id ? 'Abrindo conversa...' : 'Iniciar conversa'
                  }}
                </span>
              </span>
            </button>
            <button
              v-if="hasRecentConversationForUser(user)"
              class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#8c96a7] transition-colors hover:bg-[#e6eaf2] hover:text-[#253b73] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
              type="button"
              :aria-label="`Mais opções para ${user.name}`"
              aria-haspopup="menu"
              aria-controls="chat-context-menu"
              :aria-expanded="isContextMenuOpen({ type: 'user', user })"
              @click.stop="handleContextMenuButton($event, { type: 'user', user })"
              @keydown.enter.stop
              @keydown.space.stop
            >
              <font-awesome-icon :icon="faEllipsis" />
            </button>
          </div>
          <p
            v-if="availableUsersNotInFriends.length === 0"
            class="px-3 py-8 text-center text-xs text-[#929aaa]"
          >
            {{
              searchText.trim()
                ? 'Nenhuma pessoa encontrada para essa pesquisa.'
                : 'Não há outras pessoas disponíveis para conversar.'
            }}
          </p>
          <button
            v-if="usersHasMore"
            class="mx-auto mt-2 block rounded-full border-0 bg-white px-3 py-2 text-[10px] text-[#53617a] disabled:opacity-50"
            type="button"
            :disabled="usersLoadingMore"
            @click="loadPeople(false)"
          >
            {{ usersLoadingMore ? 'Carregando...' : 'Carregar mais pessoas' }}
          </button>
        </template>
        <p v-if="startConversationError" role="alert" class="px-3 py-3 text-xs text-red-600">
          {{ startConversationError }}
        </p>
      </div>

      <div v-else class="flex-1 overflow-y-auto p-3">
        <p v-if="conversationsLoading" class="px-3 py-8 text-center text-xs text-[#929aaa]">
          Carregando conversas...
        </p>
        <p
          v-else-if="conversationsError"
          role="alert"
          class="px-3 py-8 text-center text-xs text-red-600"
        >
          {{ conversationsError }}
          <button class="ml-1 underline" type="button" @click="loadConversationList()">
            Tentar novamente
          </button>
        </p>
        <div
          v-else
          v-for="conversation in visibleConversations"
          :key="conversation.id"
          class="group flex w-full items-center gap-1 rounded-xl p-1 transition-colors hover:bg-[#f0f3fa]"
          :class="selectedConversation?.id === conversation.id ? 'bg-[#e9eefb]' : ''"
          @contextmenu="handleContextMenu($event, { type: 'conversation', conversation })"
          @keydown="handleContextMenuKeyboard($event, { type: 'conversation', conversation })"
        >
          <button
            class="flex min-w-0 flex-1 items-center gap-3 rounded-lg border-0 bg-transparent p-2 text-left transition-colors hover:bg-[#f0f3fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad]"
            type="button"
            :aria-label="`Abrir conversa ${conversation.name}`"
            @click="selectConversation(conversation)"
          >
            <span
              class="relative grid size-10 shrink-0 place-items-center rounded-full text-[10px] font-bold"
              :class="
                conversation.category === 'community'
                  ? 'bg-[#e9eefb] text-[#536bad]'
                  : 'bg-[#ffe9e2] text-[#db6d57]'
              "
            >
              {{ getInitials(conversation.name) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center justify-between gap-2">
                <strong class="truncate text-xs text-[#172238]">{{ conversation.name }}</strong>
                <time class="shrink-0 text-[9px] text-[#9aa3b2]">{{
                  formatTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)
                }}</time>
              </span>
              <span class="mt-1 flex min-w-0 items-center justify-between gap-2">
                <span class="block truncate text-[10px] text-[#8c96a7]">{{
                  conversation.preview
                }}</span>
                <span
                  v-if="conversation.unreadCount > 0"
                  class="grid min-w-4 place-items-center rounded-full bg-[#253b73] px-1 text-[9px] font-bold text-white"
                  >{{ conversation.unreadCount }}</span
                >
              </span>
            </span>
          </button>
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#8c96a7] transition-colors hover:bg-[#e6eaf2] hover:text-[#253b73] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
            type="button"
            :aria-label="`Mais opções para ${conversation.name}`"
            aria-haspopup="menu"
            aria-controls="chat-context-menu"
            :aria-expanded="isContextMenuOpen({ type: 'conversation', conversation })"
            @click.stop="handleContextMenuButton($event, { type: 'conversation', conversation })"
            @keydown.enter.stop
            @keydown.space.stop
          >
            <font-awesome-icon :icon="faEllipsis" />
          </button>
        </div>
        <p
          v-if="!conversationsLoading && !conversationsError && visibleConversations.length === 0"
          class="px-3 py-8 text-center text-xs text-[#929aaa]"
        >
          {{
            conversations.length ? 'Nenhum resultado encontrado.' : 'Você ainda não tem conversas.'
          }}
        </p>
      </div>
    </aside>

    <main
      class="flex min-w-0 flex-1 flex-col bg-white"
      :class="{ 'max-[620px]:hidden': mobileConversationListVisible }"
    >
      <div
        v-if="chatNotice"
        class="flex items-center justify-between gap-3 border-b border-[#e8ebf0] bg-[#fff4f1] px-5 py-2 text-[10px] text-[#a44234]"
        role="alert"
      >
        <span>{{ chatNotice }}</span>
        <button
          class="shrink-0 border-0 bg-transparent underline"
          type="button"
          @click="refreshConversationList"
        >
          Atualizar lista
        </button>
      </div>
      <div
        v-if="chatSocketStatus !== 'connected' || chatSocketError"
        class="flex items-center justify-between gap-3 border-b border-[#e8ebf0] bg-[#fff9eb] px-5 py-2 text-[10px] text-[#8b6820]"
        role="status"
      >
        <span>
          {{
            chatSocketStatus === 'connecting'
              ? 'Conectando ao chat...'
              : chatSocketStatus === 'reconnecting'
                ? 'Reconectando ao chat. As mensagens serão sincronizadas ao reconectar.'
                : 'Conexão em tempo real indisponível.'
          }}
          <span v-if="chatSocketError" class="ml-1">{{ chatSocketError }}</span>
        </span>
        <button
          v-if="chatSocketStatus === 'disconnected'"
          class="shrink-0 border-0 bg-transparent underline"
          type="button"
          @click="retryChatSocket"
        >
          Tentar novamente
        </button>
      </div>
      <header
        class="flex min-h-[76px] items-center justify-between border-b border-[#e8ebf0] px-6 py-4 max-[620px]:px-4"
      >
        <div class="flex min-w-0 items-center gap-3">
          <button
            class="hidden size-8 place-items-center rounded-lg border-0 bg-[#f4f6fa] text-[#53617a] max-[620px]:grid"
            type="button"
            aria-label="Voltar para conversas"
            @click="mobileConversationListVisible = true"
          >
            <font-awesome-icon :icon="faArrowLeft" />
          </button>
          <span
            v-if="selectedConversation"
            class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ffe9e2] text-[10px] font-bold text-[#db6d57]"
          >
            <img
              v-if="selectedConversation.image"
              :src="selectedConversation.image"
              :alt="`Foto de ${selectedConversation.name}`"
              class="size-full object-cover"
            />
            <span v-else>{{ getInitials(selectedConversation.name) }}</span>
          </span>
          <div class="min-w-0">
            <h2 class="truncate font-['Space_Grotesk',sans-serif] text-sm font-semibold">
              {{ selectedConversation?.name ?? 'Conversas' }}
            </h2>
            <p v-if="selectedConversation" class="m-0 mt-0.5 text-[10px] text-[#8c96a7]">
              {{
                selectedConversation.category === 'community'
                  ? `Grupo · ${selectedConversation.members.length} participantes`
                  : 'Conversa individual'
              }}
            </p>
          </div>
        </div>
        <div v-if="selectedConversation" class="flex items-center gap-1 text-[#8c96a7]">
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-[#f4f6fa]"
            type="button"
            aria-label="Iniciar chamada de voz"
          >
            <font-awesome-icon :icon="faPhone" />
          </button>
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-[#f4f6fa]"
            type="button"
            aria-label="Iniciar chamada de vídeo"
          >
            <font-awesome-icon :icon="faVideo" />
          </button>
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-[#f4f6fa]"
            type="button"
            aria-label="Mais opções"
            :aria-expanded="groupManagementOpen"
            @click="groupManagementOpen = !groupManagementOpen"
          >
            <font-awesome-icon :icon="faEllipsis" />
          </button>
        </div>
      </header>

      <section
        v-if="groupManagementOpen && selectedConversation?.category === 'community'"
        class="max-h-56 overflow-y-auto border-b border-[#e8ebf0] bg-white px-5 py-3"
        aria-label="Participantes do grupo"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <strong class="text-xs text-[#172238]">Participantes</strong>
          <div class="flex items-center gap-2">
            <button
              v-if="isCurrentUserAdmin"
              class="border-0 bg-transparent text-[10px] font-semibold text-[#253b73] underline"
              type="button"
              @click="openGroupDialog('add')"
            >
              Adicionar
            </button>
            <button
              class="border-0 bg-transparent text-[10px] text-red-600 underline"
              type="button"
              @click="requestLeaveCurrentGroup"
            >
              Sair do grupo
            </button>
          </div>
        </div>
        <p v-if="groupManagementError" role="alert" class="mb-2 text-[10px] text-red-600">
          {{ groupManagementError }}
        </p>
        <div
          v-for="member in selectedConversation.members"
          :key="member.userId"
          class="flex items-center justify-between gap-3 py-1.5"
        >
          <span class="truncate text-[10px] text-[#53617a]">
            {{ member.name ?? 'Usuário' }}
            <span v-if="member.role === 'admin'" class="ml-1 text-[#8c96a7]">· admin</span>
            <span v-if="member.userId === currentUser.user?.sub" class="ml-1 text-[#8c96a7]">
              (você)
            </span>
          </span>
          <button
            v-if="isCurrentUserAdmin && member.userId !== currentUser.user?.sub"
            class="shrink-0 border-0 bg-transparent text-[10px] text-red-600 underline"
            type="button"
            @click="removeGroupMember(member)"
          >
            Remover
          </button>
        </div>
      </section>

      <div
        v-if="selectedConversation"
        class="flex-1 space-y-4 overflow-y-auto bg-[#e9e8e7] px-[clamp(18px,5vw,70px)] py-6"
      >
        <button
          v-if="nextCursor"
          class="mx-auto block rounded-full border-0 bg-white px-3 py-2 text-[10px] text-[#53617a] disabled:opacity-50"
          type="button"
          :disabled="messagesLoading"
          @click="loadMessages(selectedConversation.id, true)"
        >
          {{ messagesLoading ? 'Carregando...' : 'Carregar mensagens anteriores' }}
        </button>
        <p
          v-if="messagesLoading && messages.length === 0"
          class="text-center text-xs text-[#53617a]"
        >
          Carregando mensagens...
        </p>
        <p v-if="messagesError" role="alert" class="text-center text-xs text-red-700">
          {{ messagesError }}
          <button
            class="ml-1 underline"
            type="button"
            @click="loadMessages(selectedConversation.id, messages.length > 0)"
          >
            Tentar novamente
          </button>
        </p>
        <p
          v-if="!messagesLoading && !messagesError && messages.length === 0"
          class="text-center text-xs text-[#53617a]"
        >
          Nenhuma mensagem nesta conversa ainda.
        </p>
        <div
          v-for="message in messages"
          :key="message.clientMessageId"
          class="flex"
          :class="message.isMine ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[min(70%,480px)] rounded-2xl px-4 py-3 text-xs leading-relaxed"
            :class="
              message.isMine
                ? 'rounded-br-sm bg-[#253b73] text-white'
                : 'rounded-bl-sm border border-[#e8ebf0] bg-white text-[#53617a]'
            "
          >
            <span
              class="mb-1 block text-[10px] font-semibold"
              :class="message.isMine ? 'text-[#d5def8]' : 'text-[#536bad]'"
            >
              {{ getMessageSenderName(message) }}
            </span>
            <p class="m-0">{{ message.content }}</p>
            <time
              class="mt-1 block text-right text-[9px]"
              :class="message.isMine ? 'text-[#cbd5f3]' : 'text-[#a1a9b6]'"
              >{{ formatTime(message.createdAt) }}</time
            >
            <div
              v-if="message.deliveryStatus || isMessageRead(message)"
              class="mt-1 flex items-center justify-end gap-2 text-[9px]"
              :class="message.isMine ? 'text-[#cbd5f3]' : 'text-[#a1a9b6]'"
            >
              <span v-if="message.deliveryStatus === 'sending'">Enviando...</span>
              <span v-else-if="message.deliveryStatus === 'failed'">Falha no envio</span>
              <span v-else-if="isMessageRead(message)">Lida</span>
              <button
                v-if="message.deliveryStatus === 'failed'"
                class="border-0 bg-transparent p-0 text-inherit underline"
                type="button"
                :disabled="sendingMessage"
                @click="retryMessage(message)"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="flex flex-1 items-center justify-center bg-[#e9e8e7] px-6 text-center text-xs text-[#53617a]"
      >
        Selecione uma conversa para visualizar as mensagens.
      </div>

      <form
        v-if="selectedConversation"
        class="border-t border-[#e8ebf0] bg-white p-4"
        @submit.prevent="sendMessage()"
      >
        <p v-if="sendError" role="alert" class="mb-2 text-xs text-red-600">
          {{ sendError }}
        </p>
        <p v-if="sendingMessage" aria-live="polite" class="mb-2 text-xs text-[#8c96a7]">
          Enviando mensagem...
        </p>
        <div
          class="flex items-center gap-2 rounded-xl border border-[#e1e5ec] bg-[#fbfcfd] px-3 py-2"
        >
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#8c96a7] hover:bg-[#eef1f9]"
            type="button"
            aria-label="Anexar arquivo"
          >
            <font-awesome-icon :icon="faPaperclip" />
          </button>
          <input
            v-model="messageText"
            class="min-w-0 flex-1 border-0 bg-transparent px-1 text-xs text-[#172238] outline-none placeholder:text-[#a3aab6]"
            type="text"
            placeholder="Escreva uma mensagem..."
            aria-label="Mensagem"
            maxlength="4000"
            :disabled="sendingMessage"
          />
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#8c96a7] hover:bg-[#eef1f9]"
            type="button"
            aria-label="Adicionar emoji"
          >
            <font-awesome-icon :icon="faFaceSmile" />
          </button>
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg bg-[#253b73] text-white transition-colors hover:bg-[#1e305e] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            aria-label="Enviar mensagem"
            :disabled="!messageText.trim() || sendingMessage"
          >
            <font-awesome-icon :icon="faPaperPlane" class="text-xs" />
          </button>
        </div>
      </form>
    </main>

    <div
      v-if="groupDialogMode"
      class="absolute inset-0 z-20 flex items-center justify-center bg-[#172238]/35 p-4"
      @click.self="closeGroupDialog"
    >
      <form
        class="flex max-h-[min(90vh,620px)] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl"
        @submit.prevent="submitGroupDialog"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="m-0 text-base font-semibold text-[#172238]">
              {{ groupDialogMode === 'create' ? 'Criar grupo' : 'Adicionar participantes' }}
            </h2>
            <p class="mt-1 text-[10px] text-[#8c96a7]">
              {{
                groupDialogMode === 'create'
                  ? 'Escolha um nome e as pessoas que farão parte do grupo.'
                  : 'Selecione as pessoas que deseja adicionar.'
              }}
            </p>
          </div>
          <button
            class="rounded-md border-0 bg-transparent px-2 py-1 text-xs text-[#53617a] hover:bg-[#f4f6fa]"
            type="button"
            aria-label="Fechar"
            @click="closeGroupDialog"
          >
            Fechar
          </button>
        </div>
        <label
          v-if="groupDialogMode === 'create'"
          class="mb-3 block text-[10px] font-semibold text-[#53617a]"
        >
          Nome do grupo
          <input
            v-model="groupName"
            class="mt-1 w-full rounded-lg border border-[#e1e5ec] px-3 py-2 text-xs font-normal text-[#172238] outline-none focus:border-[#536bad]"
            type="text"
            maxlength="80"
            required
          />
        </label>
        <label
          class="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#e7eaf0] bg-white px-3 text-[#929aaa]"
        >
          <font-awesome-icon :icon="faSearch" class="text-xs" />
          <input
            v-model="groupSearch"
            class="w-full border-0 bg-transparent text-xs text-[#172238] outline-none placeholder:text-[#a3aab6]"
            type="search"
            placeholder="Buscar pessoas"
            @input="handleGroupSearchInput"
          />
        </label>
        <p v-if="groupDialogError" role="alert" class="my-2 text-xs text-red-600">
          {{ groupDialogError }}
        </p>
        <div class="mt-2 min-h-0 flex-1 overflow-y-auto">
          <p
            v-if="groupCandidatesLoading && groupCandidates.length === 0"
            class="py-6 text-center text-xs text-[#929aaa]"
          >
            Carregando pessoas...
          </p>
          <button
            v-for="user in groupCandidates"
            :key="user.id"
            type="button"
            :aria-pressed="groupSelectedIds.includes(user.id)"
            :disabled="
              !groupSelectedIds.includes(user.id) &&
              groupSelectedIds.length >= (groupDialogMode === 'create' ? 49 : 50)
            "
            class="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-[#f0f3fa] disabled:cursor-not-allowed disabled:opacity-50"
            @click="
              groupSelectedIds = groupSelectedIds.includes(user.id)
                ? groupSelectedIds.filter((id) => id !== user.id)
                : [...groupSelectedIds, user.id]
            "
          >
            <span
              class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e9eefb] text-[10px] font-bold text-[#536bad]"
            >
              <img
                v-if="user.image"
                :src="user.image"
                :alt="`Foto de ${user.name}`"
                class="size-full object-cover"
              />
              <span v-else>{{ getInitials(user.name) }}</span>
            </span>
            <span class="min-w-0 flex-1 truncate text-xs text-[#172238]">{{ user.name }}</span>
            <span class="text-[10px] font-semibold text-[#536bad]">
              {{ groupSelectedIds.includes(user.id) ? 'Selecionada' : 'Selecionar' }}
            </span>
          </button>
          <p
            v-if="!groupCandidatesLoading && !groupDialogError && groupCandidates.length === 0"
            class="py-6 text-center text-xs text-[#929aaa]"
          >
            {{ groupSearch.trim() ? 'Nenhuma pessoa encontrada.' : 'Não há pessoas disponíveis.' }}
          </p>
          <button
            v-if="groupCandidatesHasMore"
            class="mx-auto my-2 block rounded-full border-0 bg-[#f4f6fa] px-3 py-2 text-[10px] text-[#53617a] disabled:opacity-50"
            type="button"
            :disabled="groupCandidatesLoading"
            @click="loadGroupCandidates(false)"
          >
            {{ groupCandidatesLoading ? 'Carregando...' : 'Carregar mais pessoas' }}
          </button>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-[#e8ebf0] pt-3">
          <span class="text-[10px] text-[#8c96a7]"
            >{{ groupSelectedIds.length }} selecionada(s)</span
          >
          <button
            class="rounded-lg border-0 bg-[#253b73] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e305e] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            :disabled="groupDialogLoading || groupCandidatesLoading"
          >
            {{
              groupDialogLoading
                ? 'Salvando...'
                : groupDialogMode === 'create'
                  ? 'Criar grupo'
                  : 'Adicionar'
            }}
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="contextMenu"
      ref="contextMenuElement"
      id="chat-context-menu"
      class="fixed z-40 min-w-48 rounded-xl border border-[#e8ebf0] bg-white p-1.5 shadow-[0_12px_36px_rgba(23,34,56,.18)]"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      role="menu"
      aria-label="Opções da conversa"
      @keydown="handleContextMenuKeydown"
    >
      <button
        class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-medium text-[#b23b32] outline-none transition-colors hover:bg-[#fff2ef] focus-visible:bg-[#fff2ef]"
        type="button"
        role="menuitem"
        @click="requestRemoveFromRecent"
      >
        Remover conversa
      </button>
    </div>

    <div
      v-if="removeRecentConfirmationConversation"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#172238]/40 p-4"
      @click.self="closeRemoveRecentConfirmation"
    >
      <section
        class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-recent-title"
        aria-describedby="remove-recent-description"
        @keydown="handleRemoveRecentDialogKeydown"
      >
        <h2 id="remove-recent-title" class="m-0 text-base font-semibold text-[#172238]">
          Remover conversa de Recentes?
        </h2>
        <p id="remove-recent-description" class="mb-0 mt-2 text-xs leading-5 text-[#6f7a8d]">
          “{{ removeRecentConfirmationConversation.name }}” será ocultada da lista deste navegador.
          A conversa e as mensagens continuam no servidor. Para uma conversa individual, você pode
          restaurá-la ao iniciar uma conversa com essa pessoa novamente.
        </p>
        <p v-if="removeRecentConfirmationError" class="mb-0 mt-3 text-xs text-red-600" role="alert">
          {{ removeRecentConfirmationError }}
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            ref="removeRecentConfirmationButton"
            class="rounded-lg border border-[#e1e5ec] bg-white px-3 py-2 text-xs font-semibold text-[#53617a] transition-colors hover:bg-[#f4f6fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad] disabled:opacity-50"
            type="button"
            :disabled="removeRecentConfirmationLoading"
            @click="closeRemoveRecentConfirmation"
          >
            Cancelar
          </button>
          <button
            ref="removeRecentConfirmationSubmitButton"
            class="rounded-lg border-0 bg-[#b23b32] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#972f28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b23b32] disabled:cursor-wait disabled:opacity-60"
            type="button"
            :disabled="removeRecentConfirmationLoading"
            @click="confirmRemoveFromRecent"
          >
            {{ removeRecentConfirmationLoading ? 'Removendo…' : 'Remover conversa' }}
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="leaveConfirmationConversation"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#172238]/40 p-4"
      @click.self="closeLeaveConfirmation"
    >
      <section
        class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-conversation-title"
        aria-describedby="leave-conversation-description"
        @keydown="handleLeaveDialogKeydown"
      >
        <h2 id="leave-conversation-title" class="m-0 text-base font-semibold text-[#172238]">
          Sair deste grupo?
        </h2>
        <p id="leave-conversation-description" class="mb-0 mt-2 text-xs leading-5 text-[#6f7a8d]">
          Você deixará “{{ leaveConfirmationConversation.name }}” e não terá mais acesso à conversa.
          Isso não apaga o grupo nem as mensagens. Um administrador poderá adicionar você novamente.
        </p>
        <p v-if="leaveConfirmationError" class="mb-0 mt-3 text-xs text-red-600" role="alert">
          {{ leaveConfirmationError }}
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            ref="leaveConfirmationButton"
            class="rounded-lg border border-[#e1e5ec] bg-white px-3 py-2 text-xs font-semibold text-[#53617a] transition-colors hover:bg-[#f4f6fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#536bad] disabled:opacity-50"
            type="button"
            :disabled="leaveConfirmationLoading"
            @click="closeLeaveConfirmation"
          >
            Cancelar
          </button>
          <button
            ref="leaveConfirmationSubmitButton"
            class="rounded-lg border-0 bg-[#b23b32] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#972f28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b23b32] disabled:cursor-wait disabled:opacity-60"
            type="button"
            :disabled="leaveConfirmationLoading"
            @click="confirmLeaveConversation"
          >
            {{ leaveConfirmationLoading ? 'Saindo…' : 'Sair do grupo' }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
