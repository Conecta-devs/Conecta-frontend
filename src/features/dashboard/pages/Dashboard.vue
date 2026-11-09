<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  getMyAgendaParticipation,
  listAgendaItems,
  updateAgendaInterest,
  type AgendaItem,
} from '../services/agenda'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppDashboardIcon from '../../../shared/ui/AppDashboardIcon.vue'
import AppIcon from '../../../shared/ui/AppIcon.vue'
import AppLink from '../../../shared/ui/AppLink.vue'

type NextEvent = {
  item: AgendaItem
  interested: boolean
  confirmed: boolean
}

const nextEvent = ref<NextEvent | null>(null)
const agendaLoading = ref(true)
const agendaError = ref(false)
const savingInterest = ref(false)
const interestError = ref(false)

onMounted(async () => {
  try {
    const now = Date.now()
    const items = await listAgendaItems()

    const futureItems = items
      .filter((item) => {
        const start = Date.parse(item.startsAt)

        return item.cancelledAt == null && Number.isFinite(start) && start >= now
      })
      .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))

    const item = futureItems[0]

    if (!item) {
      nextEvent.value = null
      return
    }

    const participation = await getMyAgendaParticipation(item.id).catch(() => null)

    nextEvent.value = {
      item,
      interested: participation?.interested ?? false,
      confirmed: participation?.confirmed ?? false,
    }
  } catch (error) {
    console.error('Erro ao carregar o próximo encontro:', error)
    agendaError.value = true
  } finally {
    agendaLoading.value = false
  }
})

async function toggleInterest() {
  const entry = nextEvent.value

  if (!entry || savingInterest.value || entry.confirmed) return

  savingInterest.value = true
  interestError.value = false

  try {
    const participation = await updateAgendaInterest(entry.item.id, !entry.interested)

    nextEvent.value = {
      ...entry,
      interested: participation.interested,
      confirmed: participation.confirmed,
    }
  } catch (error) {
    console.error('Erro ao atualizar o interesse no encontro:', error)
    interestError.value = true
  } finally {
    savingInterest.value = false
  }
}

function parseDate(value: string): Date | null {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function formatDay(value: string): string {
  return parseDate(value)?.getDate().toString() ?? '--'
}

function formatMonth(value: string): string {
  const date = parseDate(value)

  return date
    ? date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
    : '---'
}

function formatHour(value: string): string {
  const date = parseDate(value)

  if (!date) return '--'

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes()

  return minutes === 0 ? `${hours}h` : `${hours}h${minutes.toString().padStart(2, '0')}`
}

const eventDay = computed(() => (nextEvent.value ? formatDay(nextEvent.value.item.startsAt) : ''))
const eventMonth = computed(() =>
  nextEvent.value ? formatMonth(nextEvent.value.item.startsAt) : '',
)
const eventTimeRange = computed(() => {
  if (!nextEvent.value) return ''

  return `${formatHour(nextEvent.value.item.startsAt)} às ${formatHour(nextEvent.value.item.endsAt)}`
})

const interestLabel = computed(() => {
  if (savingInterest.value) return 'Salvando...'
  if (nextEvent.value?.confirmed) return 'Presença confirmada'
  if (nextEvent.value?.interested) return 'Interessado'

  return 'Tenho interesse'
})

const interestVariant = computed<'blue' | 'blue-outline'>(() =>
  nextEvent.value && (nextEvent.value.interested || nextEvent.value.confirmed)
    ? 'blue-outline'
    : 'blue',
)

const communities = [
  {
    name: 'Calouros que se ajudam',
    members: 128,
    icon: 'coletive',
    symbolClass: 'bg-s-coral',
  },
  {
    name: 'Grupo de estudos de Cálculo',
    members: 64,
    icon: 'book',
    symbolClass: 'bg-traceline',
  },
  {
    name: 'Vida no campus',
    members: 215,
    icon: 'hands',
    symbolClass: 'bg-tree-bg',
  },
] as const

const conversations = [
  {
    name: 'Marina Costa',
    preview: 'Você vai ao encontro dos calouros?',
    time: 'Há 5 min',
    initials: 'MC',
    avatarClass: 'bg-s-coral',
  },
  {
    name: 'Grupo de estudos de Cálculo',
    preview: 'Pedro: podemos revisar limites juntos.',
    time: 'Há 20 min',
    initials: 'GC',
    avatarClass: 'bg-traceline',
  },
  {
    name: 'Rafael Lima',
    preview: 'Obrigado pela dica da biblioteca!',
    time: 'Há 1 h',
    initials: 'RL',
    avatarClass: 'bg-tree-bg',
  },
]
</script>

<template>
  <section
    class="dashboard-content flex w-full min-w-0 flex-col gap-3 px-[clamp(24px,5vw,76px)] pt-16 pb-16 max-[620px]:pt-8 max-[620px]:pb-10"
  >
    <div
      class="dashboard-grid grid min-w-0 grid-cols-2 gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-10"
    >
      <section class="dashboard-section community-section flex min-w-0 flex-col gap-9">
        <header class="flex h-14 items-end justify-between gap-4">
          <div class="flex flex-col gap-3">
            <p class="m-0 text-[14px] leading-4 font-medium text-text-2">DESCUBRA</p>
            <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
              Suas comunidades
            </h2>
          </div>
          <AppLink to="/dashboard/communities" size="h6">Ver todas</AppLink>
        </header>

        <div class="flex flex-col gap-4">
          <RouterLink
            v-for="community in communities"
            :key="community.name"
            to="/dashboard/communities"
            class="community-card flex h-28 items-center gap-5 rounded-2xl border border-traceline bg-white p-6 no-underline transition-colors hover:border-s-blue"
          >
            <span
              class="community-symbol grid size-14 shrink-0 place-items-center rounded-2xl"
              :class="community.symbolClass"
            >
              <AppIcon :variant="community.icon" :width="24" class="text-co-blue" />
            </span>

            <span class="min-w-0 flex-1">
              <strong class="block truncate text-[18px] leading-[21px] font-medium text-text-1">
                {{ community.name }}
              </strong>
              <span class="mt-2 block truncate text-[14px] leading-4 font-medium text-text-2">
                {{ community.members }} membros
              </span>
            </span>

            <AppDashboardIcon name="chevron-right" :size="18" class="text-text-2" />
          </RouterLink>
        </div>
      </section>

      <section class="dashboard-section conversation-section flex min-w-0 flex-col gap-9">
        <header class="flex h-14 items-end justify-between gap-4">
          <div class="flex flex-col gap-3">
            <p class="m-0 text-[14px] leading-4 font-medium text-text-2">AGORA</p>
            <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
              Conversas recentes
            </h2>
          </div>
          <AppLink to="/dashboard/chat" size="h6">Ver todas</AppLink>
        </header>

        <div class="flex flex-col gap-4">
          <RouterLink
            v-for="conversation in conversations"
            :key="conversation.name"
            to="/dashboard/chat"
            class="conversation-item flex h-28 items-center gap-5 rounded-2xl border border-traceline bg-white p-6 no-underline transition-colors hover:border-s-blue"
          >
            <span
              class="profile-avatar grid size-12 shrink-0 place-items-center rounded-full text-[14px] leading-4 font-medium text-co-blue"
              :class="conversation.avatarClass"
            >
              {{ conversation.initials }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="flex items-baseline justify-between gap-4">
                <strong class="min-w-0 truncate text-[18px] leading-[21px] font-medium text-text-1">
                  {{ conversation.name }}
                </strong>
                <time class="shrink-0 text-[14px] leading-4 font-medium text-text-2">
                  {{ conversation.time }}
                </time>
              </span>
              <span class="mt-2 block truncate text-[14px] leading-4 font-medium text-text-2">
                {{ conversation.preview }}
              </span>
            </span>
          </RouterLink>
        </div>
      </section>
    </div>

    <section class="dashboard-section event-section flex min-w-0 flex-col gap-9">
      <header class="flex h-14 items-end justify-between gap-4">
        <div class="flex flex-col gap-3">
          <p class="m-0 text-[14px] leading-4 font-medium text-text-2">NÃO PERCA</p>
          <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
            Próximos encontros
          </h2>
        </div>
        <AppLink to="/dashboard/agenda" size="h6">Ver agenda</AppLink>
      </header>

      <div
        v-if="agendaLoading"
        class="flex min-h-[148px] items-center rounded-2xl border border-traceline bg-white p-6 text-[14px] leading-4 font-medium text-text-2"
        role="status"
      >
        Carregando próximos encontros...
      </div>

      <div
        v-else-if="agendaError"
        class="flex min-h-[148px] items-center rounded-2xl border border-traceline bg-white p-6 text-[14px] leading-4 font-medium text-text-2"
        role="status"
      >
        Não foi possível carregar a Agenda agora.
      </div>

      <div
        v-else-if="!nextEvent"
        class="flex min-h-[148px] items-center rounded-2xl border border-dashed border-traceline bg-white p-6 text-[14px] leading-4 font-medium text-text-2"
      >
        Não há próximos encontros publicados.
      </div>

      <article
        v-else
        class="event-card flex min-h-[148px] flex-wrap items-center gap-9 rounded-2xl border border-traceline bg-white p-6 max-[620px]:flex-col max-[620px]:items-stretch max-[620px]:gap-5"
      >
        <div
          class="grid h-24 w-20 shrink-0 place-content-center gap-2 rounded-[10px] bg-s-coral text-center text-co-blue"
        >
          <span class="text-[32px] leading-[38px] font-semibold">{{ eventDay }}</span>
          <span class="text-[14px] leading-4 font-medium uppercase">{{ eventMonth }}</span>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex items-center gap-2 text-co-blue">
            <AppDashboardIcon
              :name="nextEvent.item.format === 'online' ? 'video' : 'calendar-days'"
              :size="16"
            />
            <span class="text-[14px] leading-4 font-medium uppercase">
              {{ nextEvent.item.format === 'online' ? 'ENCONTRO ONLINE' : 'ENCONTRO PRESENCIAL' }}
            </span>
          </div>

          <h3 class="m-0 text-[20px] leading-[23px] font-semibold text-text-1">
            {{ nextEvent.item.title }}
          </h3>

          <div class="flex flex-wrap items-center gap-5 text-text-2">
            <span class="flex items-center gap-2">
              <AppDashboardIcon name="coletive" :size="16" />
              <span class="text-[14px] leading-4 font-medium">
                {{ nextEvent.item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
              </span>
            </span>

            <span class="flex items-center gap-2">
              <AppDashboardIcon name="clock" :size="16" />
              <span class="text-[14px] leading-4 font-medium">{{ eventTimeRange }}</span>
            </span>
          </div>
        </div>

        <div
          class="ml-auto flex shrink-0 flex-col items-end gap-1 max-[620px]:ml-0 max-[620px]:items-start"
        >
          <AppButton
            :variant="interestVariant"
            :width="218"
            :padding-left="36"
            :busy="savingInterest"
            :aria-pressed="nextEvent.interested"
            @click="toggleInterest"
          >
            {{ interestLabel }}
          </AppButton>
          <span v-if="interestError" class="text-[12px] leading-4 text-co-coral">
            Não foi possível atualizar seu interesse.
          </span>
        </div>
      </article>
    </section>
  </section>
</template>
