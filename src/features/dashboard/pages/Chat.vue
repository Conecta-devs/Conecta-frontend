<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  faArrowLeft,
  faEllipsis,
  faFaceSmile,
  faPaperclip,
  faPaperPlane,
  faPhone,
  faSearch,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'

interface Conversation {
  id: number
  name: string
  preview: string
  time: string
  initials: string
  color: 'coral' | 'blue' | 'green'
  category: 'community' | 'friend'
  online?: boolean
}

type ChatSection = 'recent' | 'community' | 'friend'

interface Message {
  id: number
  text: string
  time: string
  author: 'me' | 'them'
}

const conversations: Conversation[] = [
  {
    id: 1,
    name: '{name_user}',
    preview: '{last_message}',
    time: '{last_time}',
    initials: '{initials}',
    color: 'coral',
    category: 'friend',
    online: true,
  },
  {
    id: 2,
    name: '{group_name}',
    preview: '{last_message}',
    time: '{last_time}',
    initials: '{initials}',
    color: 'blue',
    category: 'community',
  },
  {
    id: 3,
    name: '{name_user}',
    preview: '{last_message}',
    time: '{last_time}',
    initials: '{initials}',
    color: 'green',
    category: 'friend',
  },
]

const messages = ref<Message[]>([
  { id: 1, text: '{message}', time: '{message_time}', author: 'them' },
  {
    id: 2,
    text: '{message}',
    time: '{message_time}',
    author: 'them',
  },
  { id: 3, text: '{message}', time: '{message_time}', author: 'me' },
  {
    id: 4,
    text: '{message}',
    time: '{message_time}',
    author: 'me',
  },
])

const selectedConversation = ref(conversations[0])
const messageText = ref('')
const searchText = ref('')
const activeSection = ref<ChatSection>('recent')

const sectionOptions: { label: string; value: ChatSection }[] = [
  { label: 'Recentes', value: 'recent' },
  { label: 'Comunidades', value: 'community' },
  { label: 'Amigos', value: 'friend' },
]

const visibleConversations = computed(() => {
  const search = searchText.value.toLowerCase().trim()

  return conversations.filter((conversation) => {
    const matchesSection =
      activeSection.value === 'recent' || conversation.category === activeSection.value
    const matchesSearch = conversation.name.toLowerCase().includes(search)

    return matchesSection && matchesSearch
  })
})

function selectConversation(conversation: Conversation) {
  selectedConversation.value = conversation
}

function sendMessage() {
  const text = messageText.value.trim()
  if (!text) return

  messages.value.push({
    id: Date.now(),
    text,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    author: 'me',
  })
  messageText.value = ''
}
</script>

<template>
  <section class="chat-page mx-auto flex h-screen max-w-full min-h-[560px] bg-co-white">
    <aside
      class="chat-list flex w-[330px] shrink-0 flex-col border-r border-traceline bg-s-blue/20 max-[850px]:w-[285px] max-[620px]:hidden"
    >
      <div class="border-b border-traceline px-6 py-5">
        <div class="mb-4 flex items-center justify-between">
          <div class="min-w-0">
            <p class="m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-text-2">
              Mensagens
            </p>
            <h1
              class="text-h3 mt-1"
            >
              {{ sectionOptions.find((section) => section.value === activeSection)?.label }}
            </h1>
          </div>
        </div>
        <div class="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-traceline p-1">
          <button
            v-for="section in sectionOptions"
            :key="section.value"
            class="rounded-md border-0 px-1 py-2 text-[10px] font-bold text-text-2 transition-colors"
            :class="
              activeSection === section.value
                ? 'bg-co-white text-co-blue shadow-sm'
                : 'bg-transparent'
            "
            type="button"
            @click="activeSection = section.value"
          >
            {{ section.label }}
          </button>
        </div>
        <label
          class="flex h-9 items-center gap-2 rounded-lg border border-traceline bg-co-white px-3 text-text-2"
        >
          <font-awesome-icon :icon="faSearch" class="text-xs" />
          <input
            v-model="searchText"
            class="w-full border-0 bg-transparent text-xs text-text-1 outline-none placeholder:text-text-2"
            type="search"
            placeholder="Buscar conversa"
          />
        </label>
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <button
          v-for="conversation in visibleConversations"
          :key="conversation.id"
          class="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-s-blue/30"
          :class="selectedConversation.id === conversation.id ? 'bg-s-blue' : ''"
          type="button"
          @click="selectConversation(conversation)"
        >
          <span
            class="relative grid size-10 shrink-0 place-items-center rounded-full text-[10px] font-bold"
            :class="
              conversation.color === 'coral'
                ? 'bg-s-coral text-co-coral'
                : conversation.color === 'blue'
                  ? 'bg-s-blue text-co-blue'
                  : 'bg-s-green text-tree-green'
            "
          >
            {{ conversation.initials }}
            <span
              v-if="conversation.online"
              class="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-co-white bg-tree-green"
            ></span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <strong class="truncate text-xs text-text-1">{{ conversation.name }}</strong>
              <time class="shrink-0 text-[9px] text-text-2">{{ conversation.time }}</time>
            </span>
            <span class="mt-1 block truncate text-[10px] text-text-2">{{
              conversation.preview
            }}</span>
          </span>
        </button>
        <p
          v-if="visibleConversations.length === 0"
          class="px-3 py-8 text-center text-xs text-text-2"
        >
          Nenhum resultado encontrado.
        </p>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col bg-co-white">
      <header
        class="flex min-h-[76px] items-center justify-between border-b border-traceline px-6 py-4 max-[620px]:px-4"
      >
        <div class="flex min-w-0 items-center gap-3">
          <button
            class="hidden size-8 place-items-center rounded-lg border-0 bg-s-blue/30 text-text-2 max-[620px]:grid"
            type="button"
            aria-label="Voltar para conversas"
          >
            <font-awesome-icon :icon="faArrowLeft" />
          </button>
          <span
            class="grid size-10 shrink-0 place-items-center rounded-full bg-s-coral text-[10px] font-bold text-co-coral"
            >{{ selectedConversation.initials }}</span
          >
          <div class="min-w-0">
            <h2 class="text-h2 truncate">
              {{ selectedConversation.name }}
            </h2>
            <p class="m-0 mt-0.5 text-[10px] text-tree-green">
              {{ selectedConversation.online ? 'Online agora' : 'Visto recentemente' }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1 text-text-2">
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-s-blue/30"
            type="button"
            aria-label="Iniciar chamada de voz"
          >
            <font-awesome-icon :icon="faPhone" />
          </button>
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-s-blue/30"
            type="button"
            aria-label="Iniciar chamada de vídeo"
          >
            <font-awesome-icon :icon="faVideo" />
          </button>
          <button
            class="grid size-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-s-blue/30"
            type="button"
            aria-label="Mais opções"
          >
            <font-awesome-icon :icon="faEllipsis" />
          </button>
        </div>
      </header>

      <div class="flex-1 space-y-4 overflow-y-auto bg-tree-bg px-[clamp(18px,5vw,70px)] py-6">
        <p
          class="mx-auto w-fit rounded-full bg-co-white px-3 py-1 text-[9px] font-bold uppercase tracking-[.8px] text-text-2"
        >
          Hoje
        </p>
        <div
          v-for="message in messages"
          :key="message.id"
          class="flex"
          :class="message.author === 'me' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[min(70%,480px)] rounded-2xl px-4 py-3 text-xs leading-relaxed"
            :class="
              message.author === 'me'
                ? 'rounded-br-sm bg-co-blue text-co-white'
                : 'rounded-bl-sm border border-traceline bg-co-white text-text-2'
            "
          >
            <p class="m-0">{{ message.text }}</p>
            <time
              class="mt-1 block text-right text-[9px]"
              :class="message.author === 'me' ? 'text-s-blue' : 'text-text-2'"
              >{{ message.time }}</time
            >
          </div>
        </div>
      </div>

      <form class="border-t border-traceline bg-co-white p-4" @submit.prevent="sendMessage">
        <div
          class="flex items-center gap-2 rounded-xl border border-traceline bg-co-white px-3 py-2"
        >
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-s-blue/30"
            type="button"
            aria-label="Anexar arquivo"
          >
            <font-awesome-icon :icon="faPaperclip" />
          </button>
          <input
            v-model="messageText"
            class="min-w-0 flex-1 border-0 bg-transparent px-1 text-xs text-text-1 outline-none placeholder:text-text-2"
            type="text"
            placeholder="Escreva uma mensagem..."
            aria-label="Mensagem"
          />
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-text-2 hover:bg-s-blue/30"
            type="button"
            aria-label="Adicionar emoji"
          >
            <font-awesome-icon :icon="faFaceSmile" />
          </button>
          <button
            class="grid size-8 shrink-0 place-items-center rounded-lg bg-co-blue text-co-white transition-colors hover:bg-co-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            aria-label="Enviar mensagem"
            :disabled="!messageText.trim()"
          >
            <font-awesome-icon :icon="faPaperPlane" class="text-xs" />
          </button>
        </div>
      </form>
    </main>
  </section>
</template>
