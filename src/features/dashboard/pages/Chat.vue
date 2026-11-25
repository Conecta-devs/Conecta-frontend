<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  sendChatMessage,
  type ChatConversation,
  type ChatMember,
  type ChatMessage,
  type ChatUserSuggestion,
} from '@/features/dashboard/services/chat'
import {
  emitChatSocketAck,
  ChatSocketError,
} from '@/features/dashboard/services/chatSocket'
import {
  chatSocketError,
  chatSocketStatus,
  ensureChatSocket,
  getChatSocket,
  refreshChatSocketAuthentication,
  subscribeChatSocket,
} from '@/features/dashboard/composables/chatSocketClient'
import { currentUser } from '@/shared/services/session'
import AsyncState from '@/features/dashboard/components/AsyncState.vue'
import AppHeader from '@/features/dashboard/components/AppHeader.vue'
import ChatConfirmDialog from '@/features/dashboard/components/ChatConfirmDialog.vue'
import UserAvatar from '@/features/dashboard/components/UserAvatar.vue'
import {
  chatHeaderCollapsed,
  createHeaderScrollHandlers,
  mobileKeyboardHeight,
  mobileKeyboardOpen,
  preventKeyboardScroll,
  setupMobileKeyboardDetection,
} from '@/features/dashboard/composables/chatHeader'

type ChatSection = 'recent' | 'community' | 'friend' | 'people'
type ChatContextTarget =
  | { type: 'conversation'; conversation: ChatConversation }
  | { type: 'user'; user: ChatUserSuggestion }

const route = useRoute()
const router = useRouter()
const requestedConversationId = ref<string | null>(null)

const conversations = ref<ChatConversation[]>([])
const messages = ref<ChatMessage[]>([])
const availableUsers = ref<ChatUserSuggestion[]>([])
const selectedConversation = ref<ChatConversation | null>(null)
const messageText = ref('')
const TYPING_TTL_MS = 2_000
const TYPING_EMIT_INTERVAL_MS = 500
const typingByConversation = ref<Record<string, Record<string, boolean>>>({})
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()
let typingHeartbeat: ReturnType<typeof setInterval> | null = null
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
const presenceByUser = ref<Record<string, boolean>>({})
const chatNotice = ref('')
const emojiPickerOpen = ref(false)
const emojiPickerElement = ref<HTMLElement | null>(null)
const messageInputElement = ref<HTMLInputElement | null>(null)
const quickEmojis = [
  '😀',
  '😂',
  '😍',
  '😎',
  '🤔',
  '👍',
  '👏',
  '🙌',
  '❤️',
  '🎉',
  '🔥',
  '✨',
  '👀',
  '💪',
  '🙏',
  '😅',
  '😭',
  '🤝',
  '💡',
  '🚀',
]

function toggleEmojiPicker() {
  emojiPickerOpen.value = !emojiPickerOpen.value
}

function insertEmoji(emoji: string) {
  messageText.value = `${messageText.value}${emoji}`.slice(0, 4000)
  emojiPickerOpen.value = false
  void nextTick(() => messageInputElement.value?.focus())
}

function handleEmojiPickerOutside(event: PointerEvent) {
  if (!emojiPickerOpen.value) return
  if (emojiPickerElement.value?.contains(event.target as Node)) return
  emojiPickerOpen.value = false
}

function handleEmojiPickerEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !emojiPickerOpen.value) return
  emojiPickerOpen.value = false
  void nextTick(() => messageInputElement.value?.focus())
}
const readCursors = ref<Record<string, number>>({})
const readMessageIds = ref<Record<string, boolean>>({})
const READ_MESSAGES_STORAGE_PREFIX = 'conecta_read_messages:'

function readMessagesStorageKey(): string | null {
  const userId = currentUser.user?.sub
  return userId ? `${READ_MESSAGES_STORAGE_PREFIX}${userId}` : null
}

function loadReadMessages() {
  const key = readMessagesStorageKey()
  if (!key) return
  try {
    const raw = localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    readMessageIds.value =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, boolean>)
        : {}
  } catch {
    readMessageIds.value = {}
  }
}

function persistReadMessages() {
  const key = readMessagesStorageKey()
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(readMessageIds.value))
  } catch {
    // Armazenamento cheio ou indisponível: o status continua valendo na sessão.
  }
}

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
const leaveConfirmationConversation = ref<ChatConversation | null>(null)
const leaveConfirmationError = ref('')
const leaveConfirmationLoading = ref(false)
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
const MESSAGE_POLL_INTERVAL_MS = 4_000
let messagePollTimer: ReturnType<typeof setInterval> | null = null
let messagePollController: AbortController | null = null
let messagePollInFlight = false
let unsubscribeChatSocket: (() => void) | null = null
let chatPageMounted = false
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
  void refreshChatSocketAuthentication()
  return true
}

function refreshConversationList() {
  chatNotice.value = ''
  void loadConversationList()
}

function clearChatState() {
  sessionGeneration += 1
  stopMessagePolling()
  emojiPickerOpen.value = false
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
  clearTyping()
  stopTypingHeartbeat()
  availableUsers.value = []
  hiddenRecentConversationIds.value = []
  selectedConversation.value = null
  readCursors.value = {}
  readMessageIds.value = {}
  loadReadMessages()
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
  clearTyping()
  stopTypingHeartbeat()
  presenceByUser.value = {}
  joinedConversationIds.clear()
  joiningConversationIds.clear()
}

const sectionOptions: { label: string; value: ChatSection }[] = [
  { label: 'Recentes', value: 'recent' },
  { label: 'Comunidades', value: 'community' },
  { label: 'Amigos', value: 'friend' },
  { label: 'Pessoas', value: 'people' },
]

function messageDayKey(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toDateString() : date.toDateString()
}

function messageDateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'HOJE'

  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'HOJE'

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'ONTEM'

  return date
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

function shouldShowDateSeparator(index: number): boolean {
  if (index === 0) return true
  return (
    messageDayKey(messages.value[index].createdAt) !==
    messageDayKey(messages.value[index - 1].createdAt)
  )
}

const conversationPresenceOnline = computed(() => {
  const conversation = selectedConversation.value
  if (!conversation) return false
  const currentUserId = currentUser.user?.sub
  const userIds = conversation.otherUserId
    ? [conversation.otherUserId]
    : conversation.members.map((member) => member.userId).filter((id) => id !== currentUserId)
  return userIds.some((id) => presenceByUser.value[id] === true)
})

const conversationPresenceLabel = computed(() => {
  if (chatSocketStatus.value !== 'connected') return 'Sincronizando mensagens...'
  if (!selectedConversation.value) return 'Sincronizando mensagens...'
  if (!conversationPresenceOnline.value) return 'Offline'
  if (selectedConversation.value.otherUserId) return 'Online agora'
  const count = selectedConversation.value.members.filter(
    (member) =>
      member.userId !== currentUser.user?.sub && presenceByUser.value[member.userId] === true,
  ).length
  return `${count} online`
})

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

function messageReadKey(message: ChatMessage): string {
  return `${message.conversationId}:${message.clientMessageId || message.id}`
}

function cursorSaysRead(message: ChatMessage): boolean {
  const conversation = selectedConversation.value
  if (!message.isMine || !conversation) return false

  const otherUserIds = conversation.members
    .map((member) => member.userId)
    .filter((id) => id !== currentUser.user?.sub)
  if (otherUserIds.length === 0 && conversation.otherUserId) {
    otherUserIds.push(conversation.otherUserId)
  }
  if (otherUserIds.length === 0) return false

  // Em grupos, "Lida" só aparece quando todos os outros membros leram.
  return otherUserIds.every(
    (userId) => (readCursors.value[`${conversation.id}:${userId}`] ?? 0) >= message.sequence,
  )
}

function isMessageRead(message: ChatMessage): boolean {
  return readMessageIds.value[messageReadKey(message)] === true || cursorSaysRead(message)
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

function applyIncomingMessage(
  message: ChatMessage,
  options: { markRead?: boolean; updateSummary?: boolean } = {},
) {
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
  if (options.updateSummary !== false) {
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
  }
  if (
    options.markRead &&
    message.conversationId === selectedConversation.value?.id &&
    !message.isMine
  ) {
    void markCurrentConversationRead(message.conversationId)
  }
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

  // O indicador some pelo TTL natural: limpar na chegada da mensagem fazia o
  // "Digitando..." desaparecer antes de quem lê conseguir ver quando o envio
  // é rápido.

  try {
    applyIncomingMessage(normalizeChatMessage(value, value.conversationId), { markRead: true })
  } catch (error) {
    chatSocketError.value =
      error instanceof Error ? error.message : 'A mensagem recebida é inválida.'
  }
}

function markTyping(conversationId: string, userId: string) {
  const key = `${conversationId}:${userId}`
  typingByConversation.value = {
    ...typingByConversation.value,
    [conversationId]: {
      ...typingByConversation.value[conversationId],
      [userId]: true,
    },
  }
  const existingTimer = typingTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)
  typingTimers.set(
    key,
    setTimeout(() => clearTyping(conversationId, userId), TYPING_TTL_MS),
  )
}

function clearTyping(conversationId?: string, userId?: string) {
  for (const key of [...typingTimers.keys()]) {
    const matchesConversation =
      !conversationId || key.startsWith(`${conversationId}:`)
    const matchesUser =
      !conversationId || !userId || key === `${conversationId}:${userId}`
    if (matchesConversation && matchesUser) {
      const timer = typingTimers.get(key)
      if (timer) clearTimeout(timer)
      typingTimers.delete(key)
    }
  }

  if (!conversationId) {
    typingByConversation.value = {}
    return
  }

  const remaining = { ...typingByConversation.value[conversationId] }
  if (userId) delete remaining[userId]
  typingByConversation.value = {
    ...typingByConversation.value,
    [conversationId]: remaining,
  }
}

function handleSocketTyping(value: unknown) {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('conversationId' in value) ||
    typeof value.conversationId !== 'string' ||
    !('userId' in value) ||
    typeof value.userId !== 'string'
  ) {
    return
  }
  markTyping(value.conversationId, value.userId)
}

function emitTyping() {
  const conversation = selectedConversation.value
  const socket = getChatSocket()
  if (!conversation || !messageText.value.trim() || !socket?.connected) return
  socket.emit('chat:typing', { conversationId: conversation.id })
}

function stopTypingHeartbeat() {
  if (!typingHeartbeat) return
  clearInterval(typingHeartbeat)
  typingHeartbeat = null
}

function handleTypingInput() {
  const conversation = selectedConversation.value
  if (!conversation || !messageText.value.trim() || !getChatSocket()?.connected) {
    stopTypingHeartbeat()
    return
  }

  emitTyping()
  if (!typingHeartbeat) {
    typingHeartbeat = setInterval(emitTyping, TYPING_EMIT_INTERVAL_MS)
  }
}

const isOtherTyping = computed(() => {
  const conversationId = selectedConversation.value?.id
  const currentUserId = currentUser.user?.sub
  if (!conversationId) return false
  return Object.entries(typingByConversation.value[conversationId] ?? {}).some(
    ([userId, typing]) => typing && userId !== currentUserId,
  )
})

async function joinConversationRoom(conversationId: string) {
  const socket = getChatSocket()
  if (
    !socket?.connected ||
    joinedConversationIds.has(conversationId) ||
    joiningConversationIds.has(conversationId)
  ) {
    return
  }
  joiningConversationIds.add(conversationId)
  try {
    await emitChatSocketAck(socket, 'chat:conversation:join', { conversationId })
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
  const socket = getChatSocket()
  if (!socket?.connected) return
  try {
    await emitChatSocketAck(socket, 'chat:conversation:leave', { conversationId })
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
    const socket = getChatSocket()
    if (socket?.connected) {
      const result = await emitChatSocketAck<{
        conversationId: string
        lastReadSequence: number
        unreadCount: number
      }>(socket, 'chat:message:read', { conversationId })
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
  presenceByUser.value = {}
  joinedConversationIds.clear()
  joiningConversationIds.clear()
  await loadConversationList(true)
  if (selectedConversation.value) {
    await joinConversationRoom(selectedConversation.value.id)
    await loadMessages(selectedConversation.value.id)
  }
}

function unsubscribeChatSocketEvents() {
  unsubscribeChatSocket?.()
  unsubscribeChatSocket = null
}

function subscribeChatSocketEvents() {
  if (unsubscribeChatSocket) return
  if (!currentUser.user?.sub) return
  ensureChatSocket()
  unsubscribeChatSocket = subscribeChatSocket({
    'chat:message:new': handleSocketMessage,
    'chat:presence:snapshot': (value: unknown) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('conversationId' in value) ||
        typeof value.conversationId !== 'string' ||
        !('presences' in value) ||
        !Array.isArray(value.presences)
      ) {
        return
      }
      const presences = value.presences as unknown[]
      const nextPresence = { ...presenceByUser.value }
      for (const presence of presences) {
        if (
          typeof presence !== 'object' ||
          presence === null ||
          !('userId' in presence) ||
          typeof presence.userId !== 'string' ||
          !('online' in presence) ||
          typeof presence.online !== 'boolean'
        ) {
          return
        }
        nextPresence[presence.userId] = presence.online
      }
      presenceByUser.value = nextPresence
    },
    'chat:presence:update': (value: unknown) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('userId' in value) ||
        typeof value.userId !== 'string' ||
        !('online' in value) ||
        typeof value.online !== 'boolean'
      ) {
        return
      }
      presenceByUser.value = {
        ...presenceByUser.value,
        [value.userId]: value.online,
      }
    },
    'chat:typing': handleSocketTyping,
    'chat:conversation:update': updateConversationSummary,
    'chat:unread:update': applyUnreadUpdate,
    'chat:message:read': (value: unknown) => {
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
    },
    'chat:conversation:available': () => {
      void loadConversationList(true)
    },
    'chat:conversation:members': (value: unknown) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('memberIds' in value) ||
        !Array.isArray(value.memberIds) ||
        !('conversationId' in value) ||
        typeof value.conversationId !== 'string' ||
        !value.conversationId
      ) {
        return
      }
      if (selectedConversation.value?.id === value.conversationId) {
        void refreshConversationDetails(value.conversationId)
      }
      void loadConversationList(true)
    },
    'chat:conversation:removed': (value: unknown) => {
      if (
        typeof value !== 'object' ||
        value === null ||
        !('conversationId' in value) ||
        typeof value.conversationId !== 'string' ||
        !value.conversationId
      ) {
        return
      }
      clearOpenConversation(value.conversationId)
    },
  })
}

function retryChatSocket() {
  const socket = getChatSocket()
  if (socket?.connected) return
  if (!socket) {
    unsubscribeChatSocketEvents()
    ensureChatSocket()
    subscribeChatSocketEvents()
    return
  }
  void refreshChatSocketAuthentication()
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
}

function requestRemoveFromRecent() {
  const target = contextMenu.value?.target
  const conversation = target ? getContextTargetConversation(target) : undefined
  closeContextMenu()
  if (!conversation) return
  removeRecentConfirmationConversation.value = conversation
  removeRecentConfirmationError.value = ''
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
    if (getChatSocket()?.connected) {
      for (const conversation of result) void joinConversationRoom(conversation.id)
    }
    if (requestedConversationId.value) {
      const requested = result.find(
        (conversation) =>
          conversation.id === requestedConversationId.value &&
          !hiddenRecentConversationIds.value.includes(conversation.id),
      )
      requestedConversationId.value = null
      await router.replace({ query: {} })
      if (requested) {
        selectConversation(requested)
        return
      }
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

function stopMessagePolling() {
  if (messagePollTimer) clearInterval(messagePollTimer)
  messagePollTimer = null
  messagePollController?.abort()
  messagePollController = null
  messagePollInFlight = false
}

function startMessagePolling() {
  stopMessagePolling()
  messagePollTimer = setInterval(() => {
    void syncMessagesFromApi()
  }, MESSAGE_POLL_INTERVAL_MS)
}

async function syncMessagesFromApi() {
  const conversation = selectedConversation.value
  if (!conversation || messagePollInFlight || document.visibilityState !== 'visible') return

  messagePollInFlight = true
  messagePollController?.abort()
  const controller = new AbortController()
  messagePollController = controller
  const requestSessionGeneration = sessionGeneration

  try {
    const page = await listChatMessages(conversation.id, {
      limit: 50,
      signal: controller.signal,
    })
    if (
      controller.signal.aborted ||
      requestSessionGeneration !== sessionGeneration ||
      selectedConversation.value?.id !== conversation.id
    ) {
      return
    }

    const knownIds = new Set(messages.value.map((message) => message.clientMessageId))
    const newestMessage = page.messages[page.messages.length - 1]
    let hasNewIncomingMessage = false
    for (const message of page.messages) {
      if (!message.isMine && !knownIds.has(message.clientMessageId)) {
        hasNewIncomingMessage = true
      }
      applyIncomingMessage(message, {
        updateSummary: message.clientMessageId === newestMessage?.clientMessageId,
      })
    }
    if (hasNewIncomingMessage) void markCurrentConversationRead(conversation.id)
  } catch (error) {
    if (
      !controller.signal.aborted &&
      requestSessionGeneration === sessionGeneration &&
      selectedConversation.value?.id === conversation.id
    ) {
      handleConversationAccessError(error, conversation.id)
    }
  } finally {
    if (messagePollController === controller) messagePollController = null
    messagePollInFlight = false
  }
}

function handleWindowVisibilityChange() {
  if (document.visibilityState === 'visible') void syncMessagesFromApi()
}

function resetChatScrollHandlers() {
  chatListScrollHandlers.reset()
  messageScrollHandlers.reset()
}

function showMobileConversationList() {
  mobileConversationListVisible.value = true
  resetChatScrollHandlers()
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
  resetChatScrollHandlers()
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
    const message = await sendChatMessage(conversation.id, { clientMessageId, content: text })
    if (requestSessionGeneration !== sessionGeneration) return
    clearTyping(conversation.id)
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
    if (getChatSocket()?.connected) {
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
      void loadConversationList()
      startMessagePolling()
      unsubscribeChatSocketEvents()
      subscribeChatSocketEvents()
    }
  },
  { flush: 'post' },
)

// O socket é criado pelo DashboardLayout, então o chat precisa reagir a uma
// conexão que já existia (ou que conectou) fora do ciclo de montagem da página.
watch(
  chatSocketStatus,
  (status) => {
    if (status === 'connected' && chatPageMounted) void onSocketConnected()
  },
  { immediate: true },
)

// Depois que o servidor valida a leitura, guarda o status para sobreviver a
// recarregamentos do histórico ou da conversa.
watch(
  [readCursors, conversations, selectedConversation, messages],
  () => {
    const confirmed: Record<string, boolean> = {}
    for (const message of messages.value) {
      if (cursorSaysRead(message)) confirmed[messageReadKey(message)] = true
    }
    if (Object.keys(confirmed).length === 0) return
    readMessageIds.value = { ...readMessageIds.value, ...confirmed }
    persistReadMessages()
  },
  { flush: 'post' },
)

watch(
  () => selectedConversation.value?.id,
  () => {
    clearTyping()
    stopTypingHeartbeat()
  },
)

watch(messageText, (value) => {
  if (!value.trim()) stopTypingHeartbeat()
})

const messageScrollHandlers = createHeaderScrollHandlers()
const peopleListScrollHandlers = createHeaderScrollHandlers()
const conversationListScrollHandlers = createHeaderScrollHandlers()
const chatListScrollHandlers = createHeaderScrollHandlers()
let stopKeyboardDetection: (() => void) | null = null

onMounted(() => {
  chatPageMounted = true
  if (chatSocketStatus.value === 'connected') void onSocketConnected()
  stopKeyboardDetection = setupMobileKeyboardDetection(
    () => document.activeElement === messageInputElement.value,
  )
  loadReadMessages()
  const requested = route.query.conversation
  if (typeof requested === 'string' && requested) {
    requestedConversationId.value = requested
  }
  try {
    loadHiddenRecentConversations(currentUser.user?.sub ?? null)
  } catch (error) {
    chatNotice.value =
      error instanceof Error ? error.message : 'Não foi possível carregar Recentes.'
  }
  document.addEventListener('pointerdown', handleContextMenuOutside)
  document.addEventListener('keydown', handleContextMenuEscape)
  document.addEventListener('pointerdown', handleEmojiPickerOutside)
  document.addEventListener('keydown', handleEmojiPickerEscape)
  document.addEventListener('visibilitychange', handleWindowVisibilityChange)
  window.addEventListener('resize', handleContextMenuViewportChange)
  window.addEventListener('scroll', handleContextMenuViewportChange, true)
  void loadConversationList()
  startMessagePolling()
  subscribeChatSocketEvents()
})

onUnmounted(() => {
  chatPageMounted = false
  unsubscribeChatSocketEvents()
  stopKeyboardDetection?.()
  document.removeEventListener('pointerdown', handleContextMenuOutside)
  document.removeEventListener('keydown', handleContextMenuEscape)
  document.removeEventListener('pointerdown', handleEmojiPickerOutside)
  document.removeEventListener('keydown', handleEmojiPickerEscape)
  document.removeEventListener('visibilitychange', handleWindowVisibilityChange)
  window.removeEventListener('resize', handleContextMenuViewportChange)
  window.removeEventListener('scroll', handleContextMenuViewportChange, true)
  stopMessagePolling()
  clearTyping()
  stopTypingHeartbeat()
  conversationsController?.abort()
  messagesController?.abort()
  usersController?.abort()
  groupCandidatesController?.abort()
  if (usersSearchTimeout) clearTimeout(usersSearchTimeout)
  if (groupSearchTimeout) clearTimeout(groupSearchTimeout)
  disposeCurrentChatSocket()
  chatHeaderCollapsed.value = false
  messageScrollHandlers.reset()
  peopleListScrollHandlers.reset()
  conversationListScrollHandlers.reset()
  chatListScrollHandlers.reset()
})
</script>

<template>
  <section
    class="chat-page relative flex h-dvh min-h-[560px] w-full flex-col bg-co-white text-text-1 max-[900px]:min-h-0 max-[620px]:!min-h-0"
    :class="
      mobileKeyboardOpen
        ? 'max-[620px]:!h-[var(--chat-keyboard-height)]'
        : 'max-[620px]:!h-[calc(100dvh-65px)]'
    "
    :style="{ '--chat-keyboard-height': `${mobileKeyboardHeight}px` }"
  >
    <AppHeader
      v-model:search-value="searchText"
      variant="chat"
      :collapsed="chatHeaderCollapsed"
      @search-input="handleSearchInput"
    />

    <div
      class="flex min-h-0 flex-1 flex-col px-[clamp(24px,3.3vw,48px)] py-8 max-[620px]:!p-0"
    >
      <div class="flex min-h-0 flex-1 gap-6 max-[900px]:flex-col">
        <aside
          class="chat-list flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-card border border-traceline bg-co-white p-5 max-[900px]:min-h-0 max-[900px]:w-full max-[900px]:flex-1 max-[620px]:!rounded-none max-[620px]:!border-0 max-[620px]:!p-4"
          :class="{ 'max-[620px]:hidden': !mobileConversationListVisible }"
          @scroll.passive="chatListScrollHandlers.onScroll"
          @touchstart.passive="chatListScrollHandlers.onTouchStart"
          @touchmove="chatListScrollHandlers.onTouchMove"
          @touchend.passive="chatListScrollHandlers.onTouchEnd"
          @touchcancel.passive="chatListScrollHandlers.onTouchEnd"
        >
          <div class="flex shrink-0 flex-col gap-5">
            <div>
              <p class="m-0 text-h6 leading-4 font-medium text-text-2">MENSAGENS</p>
              <h2 class="text-h2 mt-1">
                {{ sectionOptions.find((section) => section.value === activeSection)?.label }}
              </h2>
            </div>
            <div class="flex items-start gap-1 rounded-button bg-traceline p-[6px]">
              <button
                v-for="section in sectionOptions.slice(0, 3)"
                :key="section.value"
                class="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[6px] border-0 py-[10px] text-h6 leading-4 font-medium transition-colors"
                :class="
                  activeSection === section.value
                    ? 'bg-co-white text-co-blue'
                    : 'bg-transparent text-text-2 hover:text-co-blue'
                "
                type="button"
                @click="selectSection(section.value)"
              >
                {{ section.label }}
                <span
                  v-if="sectionUnreadCounts[section.value] > 0"
                  class="grid min-w-4 place-items-center rounded-full bg-co-blue px-1 text-[10px] leading-4 text-co-white"
                  :aria-label="`${sectionUnreadCounts[section.value]} mensagens não lidas`"
                >
                  {{
                    sectionUnreadCounts[section.value] > 99
                      ? '99+'
                      : sectionUnreadCounts[section.value]
                  }}
                </span>
              </button>
            </div>
            <label
              class="flex h-12 items-center gap-[10px] rounded-button border border-traceline bg-white px-3 text-text-2"
            >
              <font-awesome-icon :icon="faSearch" />
              <input
                v-model="searchText"
                class="w-full min-w-0 border-0 bg-transparent text-h6 leading-4 font-medium text-text-1 outline-none placeholder:text-text-2"
                type="search"
                :placeholder="activeSection === 'people' ? 'Buscar pessoa' : 'Buscar conversa'"
                :aria-label="activeSection === 'people' ? 'Buscar pessoa' : 'Buscar conversa'"
                @input="handleSearchInput"
              />
            </label>
            <div class="flex items-center justify-between gap-2">
              <button
                class="flex items-center gap-2 rounded-[6px] border-0 bg-transparent px-1 py-1 text-h6 leading-normal font-medium transition-colors"
                :class="
                  activeSection === 'people' ? 'text-co-blue' : 'text-text-2 hover:text-co-blue'
                "
                type="button"
                aria-label="Buscar pessoas"
                @click="selectSection('people')"
              >
                <font-awesome-icon :icon="faUsers" class="text-xs" />
                Pessoas
              </button>
              <button
                class="grid size-8 shrink-0 place-items-center rounded-[8px] border-0 bg-traceline text-co-blue transition-colors hover:bg-s-blue/50"
                type="button"
                aria-label="Criar grupo"
                title="Criar grupo"
                @click="openGroupDialog('create')"
              >
                <font-awesome-icon :icon="faUsers" class="text-xs" />
              </button>
            </div>
          </div>

        <div
          v-if="activeSection === 'people'"
          class="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          @scroll.passive="peopleListScrollHandlers.onScroll"
          @touchstart.passive="peopleListScrollHandlers.onTouchStart"
          @touchmove="peopleListScrollHandlers.onTouchMove"
          @touchend.passive="peopleListScrollHandlers.onTouchEnd"
          @touchcancel.passive="peopleListScrollHandlers.onTouchEnd"
        >
          <AsyncState
            v-if="usersLoading"
            kind="loading"
            message="Carregando pessoas..."
            class="px-3 py-8 text-center text-h6 leading-normal"
          />
          <AsyncState
            v-else-if="usersError"
            kind="error"
            :message="usersError"
            class="px-3 py-8 text-center text-h6 leading-normal"
          >
            <template #action>
              <button class="ml-1 underline" type="button" @click="loadPeople(true)">
                Tentar novamente
              </button>
            </template>
          </AsyncState>
          <template v-else>
            <div
              v-for="user in availableUsersNotInFriends"
              :key="user.id"
              class="group flex w-full items-center gap-1 rounded-button transition-colors hover:bg-traceline/60"
              @contextmenu="handleContextMenu($event, { type: 'user', user })"
              @keydown="handleContextMenuKeyboard($event, { type: 'user', user })"
            >
              <button
                class="flex min-w-0 flex-1 items-center gap-3 rounded-button border-0 bg-transparent px-3 py-4 text-left transition-colors hover:bg-traceline/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-co-blue disabled:cursor-wait disabled:opacity-60"
                type="button"
                :aria-label="`Iniciar conversa com ${user.name}`"
                :disabled="creatingConversationFor !== null"
                @click="startDirectConversation(user)"
              >
                <UserAvatar
                  :name="user.name"
                  :image="user.image"
                  class="size-10 overflow-hidden bg-s-coral text-h6 leading-normal font-medium text-co-blue"
                />
                <span class="min-w-0 flex-1">
                  <strong class="block truncate text-h6 leading-normal font-medium text-co-blue">{{ user.name }}</strong>
                  <span class="mt-1 block truncate text-h6 leading-normal text-text-2">
                    {{
                      creatingConversationFor === user.id ? 'Abrindo conversa...' : 'Iniciar conversa'
                    }}
                  </span>
                </span>
              </button>
              <button
                v-if="hasRecentConversationForUser(user)"
                class="grid size-8 shrink-0 place-items-center rounded-[8px] border-0 bg-transparent text-text-2 transition-colors hover:bg-traceline hover:text-co-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-co-blue sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
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
              class="px-3 py-8 text-center text-h6 leading-normal text-text-2"
            >
              {{
                searchText.trim()
                  ? 'Nenhuma pessoa encontrada para essa pesquisa.'
                  : 'Não há outras pessoas disponíveis para conversar.'
              }}
            </p>
            <button
              v-if="usersHasMore"
              class="mx-auto mt-2 block rounded-button border-0 bg-traceline px-3 py-2 text-h6 leading-normal text-text-2 disabled:opacity-50"
              type="button"
              :disabled="usersLoadingMore"
              @click="loadPeople(false)"
            >
              {{ usersLoadingMore ? 'Carregando...' : 'Carregar mais pessoas' }}
            </button>
          </template>
          <AsyncState
            v-if="startConversationError"
            kind="error"
            :message="startConversationError"
            class="px-3 py-3 text-h6 leading-normal"
          />
        </div>

        <div
          v-else
          class="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          @scroll.passive="conversationListScrollHandlers.onScroll"
          @touchstart.passive="conversationListScrollHandlers.onTouchStart"
          @touchmove="conversationListScrollHandlers.onTouchMove"
          @touchend.passive="conversationListScrollHandlers.onTouchEnd"
          @touchcancel.passive="conversationListScrollHandlers.onTouchEnd"
        >
          <AsyncState
            v-if="conversationsLoading"
            kind="loading"
            message="Carregando conversas..."
            class="px-3 py-8 text-center text-h6 leading-normal"
          />
          <AsyncState
            v-else-if="conversationsError"
            kind="error"
            :message="conversationsError"
            class="px-3 py-8 text-center text-h6 leading-normal"
          >
            <template #action>
              <button class="ml-1 underline" type="button" @click="loadConversationList()">
                Tentar novamente
              </button>
            </template>
          </AsyncState>
          <div
            v-else
            v-for="conversation in visibleConversations"
            :key="conversation.id"
            class="group flex w-full items-center gap-1 rounded-button transition-colors hover:bg-traceline/60"
            :class="selectedConversation?.id === conversation.id ? 'bg-traceline' : ''"
            @contextmenu="handleContextMenu($event, { type: 'conversation', conversation })"
            @keydown="handleContextMenuKeyboard($event, { type: 'conversation', conversation })"
          >
            <button
              class="flex min-w-0 flex-1 items-center gap-3 rounded-button border-0 bg-transparent px-3 py-4 text-left transition-colors hover:bg-traceline/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-co-blue"
              type="button"
              :aria-label="`Abrir conversa ${conversation.name}`"
              @click="selectConversation(conversation)"
            >
              <UserAvatar
                :name="conversation.name"
                :image="conversation.image"
                class="relative size-10 overflow-hidden text-h6 leading-normal font-medium text-co-blue"
                :class="
                  conversation.category === 'community'
                    ? 'bg-traceline'
                    : conversation.category === 'friend'
                      ? 'bg-tree-bg'
                      : 'bg-s-coral'
                "
              />
              <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-1.5">
                  <strong class="truncate text-h6 leading-normal font-medium text-co-blue">{{
                    conversation.name
                  }}</strong>
                  <time class="shrink-0 text-h6 leading-normal text-text-2">{{
                    formatTime(conversation.lastMessage?.createdAt ?? conversation.updatedAt)
                  }}</time>
                </span>
                <span class="mt-2 flex min-w-0 items-center justify-between gap-1.5">
                  <span class="block truncate text-h6 leading-normal text-text-2">{{
                    conversation.preview
                  }}</span>
                  <span
                    v-if="conversation.unreadCount > 0"
                    class="grid min-w-4 shrink-0 place-items-center rounded-full bg-co-blue px-1 text-[10px] font-medium text-co-white"
                    >{{ conversation.unreadCount }}</span
                  >
                </span>
              </span>
            </button>
            <button
              class="grid size-8 shrink-0 place-items-center rounded-[8px] border-0 bg-transparent text-text-2 transition-colors hover:bg-traceline hover:text-co-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-co-blue sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
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
            class="px-3 py-8 text-center text-h6 leading-normal text-text-2"
          >
            {{
              conversations.length ? 'Nenhum resultado encontrado.' : 'Você ainda não tem conversas.'
            }}
          </p>
        </div>
        </aside>

        <main
          class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-card border border-traceline bg-white max-[620px]:!rounded-none max-[620px]:!border-0"
          :class="{ 'max-[620px]:hidden': mobileConversationListVisible }"
        >
          <div
            v-if="chatNotice"
            class="flex shrink-0 items-center justify-between gap-3 border-b border-traceline bg-s-coral px-6 py-2 text-h6 leading-normal text-text-1"
            role="alert"
          >
            <span>{{ chatNotice }}</span>
            <button
              class="shrink-0 border-0 bg-transparent text-co-blue underline"
              type="button"
              @click="refreshConversationList"
            >
              Atualizar lista
            </button>
          </div>
          <div
            v-if="chatSocketStatus !== 'connected' || chatSocketError"
            class="flex shrink-0 items-center justify-between gap-3 border-b border-traceline bg-s-blue/30 px-6 py-2 text-h6 leading-normal text-text-1"
            role="status"
          >
            <span>
              {{
                chatSocketStatus === 'connecting'
                  ? 'Conectando ao chat...'
                  : 'Sincronizando mensagens com o servidor.'
              }}
            </span>
            <button
              v-if="chatSocketStatus === 'disconnected'"
              class="shrink-0 border-0 bg-transparent text-co-blue underline"
              type="button"
              @click="retryChatSocket"
            >
              Tentar tempo real
            </button>
          </div>
          <header
            class="flex h-[90px] shrink-0 items-center justify-between gap-4 border-b border-traceline px-6 max-[620px]:px-4"
            @touchmove="preventKeyboardScroll"
          >
            <div class="flex min-w-0 items-center gap-4">
              <button
                class="hidden size-9 place-items-center rounded-[8px] border-0 bg-traceline text-text-2 max-[620px]:grid"
                type="button"
                aria-label="Voltar para conversas"
                @click="showMobileConversationList"
              >
                <font-awesome-icon :icon="faArrowLeft" />
              </button>
              <UserAvatar
                v-if="selectedConversation"
                :name="selectedConversation.name"
                :image="selectedConversation.image"
                class="size-11 overflow-hidden bg-s-coral text-h6 leading-normal font-medium text-co-blue"
              />
              <div class="min-w-0">
                <h2 class="text-h3 truncate">
                  {{ selectedConversation?.name ?? 'Conversas' }}
                </h2>
                <p v-if="selectedConversation" class="m-0 mt-1.5 flex items-center gap-1.5 text-h6 leading-normal text-text-2">
                  <span
                    class="size-1.5 shrink-0 rounded-full"
                    :class="
                      chatSocketStatus === 'connected' && conversationPresenceOnline
                        ? 'bg-tree-green'
                        : 'bg-traceline'
                    "
                  ></span>
                  {{ conversationPresenceLabel }}
                </p>
              </div>
            </div>
            <div v-if="selectedConversation" class="flex shrink-0 items-center gap-3 text-text-2">
              <button
                class="grid size-9 place-items-center rounded-[8px] border-0 bg-transparent transition-colors hover:bg-traceline hover:text-co-blue disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Iniciar chamada de voz"
                title="Chamadas em breve"
                disabled
              >
                <font-awesome-icon :icon="faPhone" />
              </button>
              <button
                class="grid size-9 place-items-center rounded-[8px] border-0 bg-transparent transition-colors hover:bg-traceline hover:text-co-blue disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Iniciar chamada de vídeo"
                title="Chamadas em breve"
                disabled
              >
                <font-awesome-icon :icon="faVideo" />
              </button>
              <button
                v-if="selectedConversation.category === 'community'"
                class="grid size-9 place-items-center rounded-[8px] border-0 bg-transparent transition-colors hover:bg-traceline hover:text-co-blue"
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
        class="max-h-56 shrink-0 overflow-y-auto border-b border-traceline bg-white px-6 py-3"
        aria-label="Participantes do grupo"
      >
        <div class="mb-2 flex items-center justify-between gap-3">
          <strong class="text-xs text-text-1">Participantes</strong>
          <div class="flex items-center gap-2">
            <button
              v-if="isCurrentUserAdmin"
              class="border-0 bg-transparent text-[10px] font-semibold text-co-blue underline"
              type="button"
              @click="openGroupDialog('add')"
            >
              Adicionar
            </button>
            <button
              class="border-0 bg-transparent text-[10px] text-danger underline"
              type="button"
              @click="requestLeaveCurrentGroup"
            >
              Sair do grupo
            </button>
          </div>
        </div>
        <p v-if="groupManagementError" role="alert" class="mb-2 text-[10px] text-danger">
          {{ groupManagementError }}
        </p>
        <div
          v-for="member in selectedConversation.members"
          :key="member.userId"
          class="flex items-center justify-between gap-3 py-1.5"
        >
          <span class="truncate text-[10px] text-text-2">
            {{ member.name ?? 'Usuário' }}
            <span v-if="member.role === 'admin'" class="ml-1 text-text-2">· admin</span>
            <span v-if="member.userId === currentUser.user?.sub" class="ml-1 text-text-2">
              (você)
            </span>
          </span>
          <button
            v-if="isCurrentUserAdmin && member.userId !== currentUser.user?.sub"
            class="shrink-0 border-0 bg-transparent text-[10px] text-danger underline"
            type="button"
            @click="removeGroupMember(member)"
          >
            Remover
          </button>
        </div>
      </section>

          <div
            v-if="selectedConversation"
            class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain bg-white p-6 max-[620px]:p-4"
            @scroll.passive="messageScrollHandlers.onScroll"
            @touchstart.passive="messageScrollHandlers.onTouchStart"
            @touchmove="messageScrollHandlers.onTouchMove"
            @touchend.passive="messageScrollHandlers.onTouchEnd"
            @touchcancel.passive="messageScrollHandlers.onTouchEnd"
          >
            <button
              v-if="nextCursor"
              class="mx-auto block shrink-0 rounded-button border border-traceline bg-co-white px-3 py-2 text-h6 leading-normal text-text-2 disabled:opacity-50"
              type="button"
              :disabled="messagesLoading"
              @click="loadMessages(selectedConversation.id, true)"
            >
              {{ messagesLoading ? 'Carregando...' : 'Carregar mensagens anteriores' }}
            </button>
            <AsyncState
              v-if="messagesLoading && messages.length === 0"
              kind="loading"
              message="Carregando mensagens..."
              class="text-center text-h6 leading-normal"
            />
            <AsyncState
              v-if="messagesError"
              kind="error"
              :message="messagesError"
              class="text-center text-h6 leading-normal"
            >
              <template #action>
                <button
                  class="ml-1 underline"
                  type="button"
                  @click="loadMessages(selectedConversation.id, messages.length > 0)"
                >
                  Tentar novamente
                </button>
              </template>
            </AsyncState>
            <AsyncState
              v-if="!messagesLoading && !messagesError && messages.length === 0"
              kind="empty"
              message="Nenhuma mensagem nesta conversa ainda."
              class="text-center text-h6 leading-normal"
            />
            <template v-for="(message, index) in messages" :key="message.clientMessageId">
              <p
                v-if="shouldShowDateSeparator(index)"
                class="shrink-0 text-center text-h6 leading-normal font-medium text-text-2"
              >
                {{ messageDateLabel(message.createdAt) }}
              </p>
              <div
                class="flex shrink-0"
                :class="message.isMine ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="flex flex-col gap-2 rounded-card px-4 py-3 max-[620px]:gap-1.5 max-[620px]:px-3 max-[620px]:py-2.5"
                  :class="
                    message.isMine
                      ? 'w-[min(380px,85%)] bg-co-blue text-co-white'
                      : 'w-[min(460px,85%)] border border-traceline bg-co-white text-text-1'
                  "
                >
                  <span
                    v-if="selectedConversation.category === 'community' && !message.isMine"
                    class="text-h6 leading-normal font-medium text-co-blue"
                  >
                    {{ getMessageSenderName(message) }}
                  </span>
                  <p class="m-0 text-h5 leading-5 font-medium">{{ message.content }}</p>
                  <div
                    class="flex items-center justify-end gap-1.5 text-[10px] leading-normal"
                    :class="message.isMine ? 'text-co-white' : 'text-text-2'"
                  >
                    <template v-if="message.deliveryStatus || isMessageRead(message)">
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
                      <span
                        class="size-1 shrink-0 rounded-full bg-current"
                        aria-hidden="true"
                      ></span>
                    </template>
                    <time class="shrink-0">{{ formatTime(message.createdAt) }}</time>
                  </div>
                </div>
              </div>
            </template>
            <div
              v-if="isOtherTyping"
              class="flex shrink-0 justify-start py-1 text-h6 leading-normal text-text-2"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true">Digitando...</span>
              <span class="sr-only">{{ selectedConversation?.name ?? 'A outra pessoa' }} está digitando</span>
            </div>
          </div>
          <div
            v-else
            class="flex min-h-0 flex-1 items-center justify-center bg-white px-6 text-center text-h6 leading-normal text-text-2"
          >
            Selecione uma conversa para visualizar as mensagens.
          </div>

          <form
            v-if="selectedConversation"
            class="flex min-h-[84px] shrink-0 items-center gap-3 px-5 py-4 max-[620px]:px-4"
            @submit.prevent="sendMessage()"
            @touchmove="preventKeyboardScroll"
          >
            <p v-if="sendError" role="alert" class="mb-2 text-h6 leading-normal text-danger">
              {{ sendError }}
            </p>
            <p v-if="sendingMessage" aria-live="polite" class="mb-2 text-h6 leading-normal text-text-2">
              Enviando mensagem...
            </p>
            <div
              class="flex h-[52px] min-w-0 flex-1 items-center gap-[14px] rounded-button border border-traceline bg-co-white px-4"
            >
              <button
                class="grid size-5 shrink-0 place-items-center border-0 bg-transparent text-text-2 hover:text-co-blue disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
                aria-label="Anexar arquivo"
                title="Envio de arquivos em breve"
                disabled
              >
                <font-awesome-icon :icon="faPaperclip" />
              </button>
              <input
                ref="messageInputElement"
                v-model="messageText"
                @input="handleTypingInput"
                class="min-w-0 flex-1 border-0 bg-transparent text-h6 leading-normal font-medium text-text-1 outline-none placeholder:text-text-2"
                type="text"
                placeholder="Escreva uma mensagem..."
                aria-label="Mensagem"
                maxlength="4000"
                :disabled="sendingMessage"
              />
              <div ref="emojiPickerElement" class="relative grid size-5 shrink-0 place-items-center">
                <button
                  class="grid size-5 place-items-center border-0 bg-transparent text-text-2 hover:text-co-blue"
                  type="button"
                  aria-label="Adicionar emoji"
                  :aria-expanded="emojiPickerOpen"
                  @click="toggleEmojiPicker"
                >
                  <font-awesome-icon :icon="faFaceSmile" />
                </button>
                <div
                  v-if="emojiPickerOpen"
                  class="absolute right-0 bottom-full z-30 mb-3 grid w-[220px] grid-cols-5 gap-1 rounded-card border border-traceline bg-white p-2 shadow-xl"
                  role="group"
                  aria-label="Emojis rápidos"
                >
                  <button
                    v-for="emoji in quickEmojis"
                    :key="emoji"
                    class="grid size-9 place-items-center rounded-[8px] border-0 bg-transparent text-lg transition-colors hover:bg-traceline"
                    type="button"
                    :aria-label="`Inserir emoji ${emoji}`"
                    @click="insertEmoji(emoji)"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </div>
            <button
              class="grid size-12 shrink-0 place-items-center rounded-button border-0 bg-co-blue text-co-white transition-colors hover:bg-co-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              aria-label="Enviar mensagem"
              :disabled="!messageText.trim() || sendingMessage"
            >
              <font-awesome-icon :icon="faPaperPlane" />
            </button>
          </form>
        </main>
      </div>
    </div>

    <div
      v-if="groupDialogMode"
      class="absolute inset-0 z-20 flex items-center justify-center bg-overlay/35 p-4"
      @click.self="closeGroupDialog"
    >
      <form
        class="flex max-h-[min(90vh,620px)] w-full max-w-md flex-col rounded-card bg-white p-5 shadow-xl"
        @submit.prevent="submitGroupDialog"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="m-0 text-base font-semibold text-text-1">
              {{ groupDialogMode === 'create' ? 'Criar grupo' : 'Adicionar participantes' }}
            </h2>
            <p class="mt-1 text-[10px] text-text-2">
              {{
                groupDialogMode === 'create'
                  ? 'Escolha um nome e as pessoas que farão parte do grupo.'
                  : 'Selecione as pessoas que deseja adicionar.'
              }}
            </p>
          </div>
          <button
            class="rounded-md border-0 bg-transparent px-2 py-1 text-xs text-text-2 hover:bg-co-white"
            type="button"
            aria-label="Fechar"
            @click="closeGroupDialog"
          >
            Fechar
          </button>
        </div>
        <label
          v-if="groupDialogMode === 'create'"
          class="mb-3 block text-[10px] font-semibold text-text-2"
        >
          Nome do grupo
          <input
            v-model="groupName"
            class="mt-1 w-full rounded-lg border border-traceline px-3 py-2 text-xs font-normal text-text-1 outline-none focus:border-co-blue"
            type="text"
            maxlength="80"
            required
          />
        </label>
        <label
          class="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-traceline bg-white px-3 text-text-2"
        >
          <font-awesome-icon :icon="faSearch" class="text-xs" />
          <input
            v-model="groupSearch"
            class="w-full border-0 bg-transparent text-xs text-text-1 outline-none placeholder:text-text-2"
            type="search"
            placeholder="Buscar pessoas"
            @input="handleGroupSearchInput"
          />
        </label>
        <p v-if="groupDialogError" role="alert" class="my-2 text-xs text-danger">
          {{ groupDialogError }}
        </p>
        <div class="mt-2 min-h-0 flex-1 overflow-y-auto">
          <AsyncState
            v-if="groupCandidatesLoading && groupCandidates.length === 0"
            kind="loading"
            message="Carregando pessoas..."
            class="py-6 text-center text-xs"
          />
          <button
            v-for="user in groupCandidates"
            :key="user.id"
            type="button"
            :aria-pressed="groupSelectedIds.includes(user.id)"
            :disabled="
              !groupSelectedIds.includes(user.id) &&
              groupSelectedIds.length >= (groupDialogMode === 'create' ? 49 : 50)
            "
            class="flex w-full items-center gap-3 rounded-icon p-3 text-left hover:bg-co-white disabled:cursor-not-allowed disabled:opacity-50"
            @click="
              groupSelectedIds = groupSelectedIds.includes(user.id)
                ? groupSelectedIds.filter((id) => id !== user.id)
                : [...groupSelectedIds, user.id]
            "
          >
            <UserAvatar
              :name="user.name"
              :image="user.image"
              class="size-9 overflow-hidden bg-co-white text-[10px] font-bold text-co-blue"
            />
            <span class="min-w-0 flex-1 truncate text-xs text-text-1">{{ user.name }}</span>
            <span class="text-[10px] font-semibold text-co-blue">
              {{ groupSelectedIds.includes(user.id) ? 'Selecionada' : 'Selecionar' }}
            </span>
          </button>
          <AsyncState
            v-if="!groupCandidatesLoading && !groupDialogError && groupCandidates.length === 0"
            kind="empty"
            :message="groupSearch.trim() ? 'Nenhuma pessoa encontrada.' : 'Não há pessoas disponíveis.'"
            class="py-6 text-center text-xs"
          />
          <button
            v-if="groupCandidatesHasMore"
            class="mx-auto my-2 block rounded-full border-0 bg-co-white px-3 py-2 text-[10px] text-text-2 disabled:opacity-50"
            type="button"
            :disabled="groupCandidatesLoading"
            @click="loadGroupCandidates(false)"
          >
            {{ groupCandidatesLoading ? 'Carregando...' : 'Carregar mais pessoas' }}
          </button>
        </div>
        <div class="mt-4 flex items-center justify-between gap-3 border-t border-traceline pt-3">
          <span class="text-[10px] text-text-2"
            >{{ groupSelectedIds.length }} selecionada(s)</span
          >
          <button
            class="rounded-lg border-0 bg-co-blue px-4 py-2 text-xs font-semibold text-white hover:bg-co-blue hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
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
      class="fixed z-40 min-w-48 rounded-icon border border-traceline bg-white p-1.5 shadow-[0_12px_36px_rgba(23,34,56,.18)]"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      role="menu"
      aria-label="Opções da conversa"
      @keydown="handleContextMenuKeydown"
    >
      <button
        class="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-medium text-danger outline-none transition-colors hover:bg-s-coral focus-visible:bg-s-coral"
        type="button"
        role="menuitem"
        @click="requestRemoveFromRecent"
      >
        Remover conversa
      </button>
    </div>

    <ChatConfirmDialog
      v-if="removeRecentConfirmationConversation"
      title="Remover conversa de Recentes?"
      :description="`“${removeRecentConfirmationConversation.name}” será ocultada da lista deste navegador. A conversa e as mensagens continuam no servidor. Para uma conversa individual, você pode restaurá-la ao iniciar uma conversa com essa pessoa novamente.`"
      confirm-label="Remover conversa"
      busy-label="Removendo…"
      :error="removeRecentConfirmationError"
      :loading="removeRecentConfirmationLoading"
      labelled-by="remove-recent-title"
      described-by="remove-recent-description"
      @confirm="confirmRemoveFromRecent"
      @cancel="closeRemoveRecentConfirmation"
    />

    <ChatConfirmDialog
      v-if="leaveConfirmationConversation"
      title="Sair deste grupo?"
      :description="`Você deixará “${leaveConfirmationConversation.name}” e não terá mais acesso à conversa. Isso não apaga o grupo nem as mensagens. Um administrador poderá adicionar você novamente.`"
      confirm-label="Sair do grupo"
      busy-label="Saindo…"
      :error="leaveConfirmationError"
      :loading="leaveConfirmationLoading"
      labelled-by="leave-conversation-title"
      described-by="leave-conversation-description"
      @confirm="confirmLeaveConversation"
      @cancel="closeLeaveConfirmation"
    />
  </section>
</template>
