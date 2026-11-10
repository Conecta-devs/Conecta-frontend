<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  getMyAgendaParticipation,
  listAgendaItems,
  type AgendaItem,
  type AgendaParticipation,
} from '../services/agenda'
import AgendaDetailsModal from '../components/AgendaDetailsModal.vue'
import DashboardCalendar from '../components/DashboardCalendar.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppDashboardIcon from '../../../shared/ui/AppDashboardIcon.vue'
import AppIcon from '../../../shared/ui/AppIcon.vue'
import AppLink from '../../../shared/ui/AppLink.vue'

const agendaItems = ref<AgendaItem[]>([])
const participations = ref<Record<string, AgendaParticipation>>({})
const upcomingEvents = ref<AgendaItem[]>([])
const agendaLoading = ref(true)
const agendaError = ref(false)
const detailsOpen = ref(false)
const detailsItems = ref<AgendaItem[]>([])
const detailsHeading = ref<string | undefined>()

async function loadParticipations(items: AgendaItem[], skipId?: string) {
  const targets = items.filter((item) => item.cancelledAt == null && item.id !== skipId)

  if (!targets.length) return

  const results = await Promise.allSettled(
    targets.map(async (item) => {
      const participation = await getMyAgendaParticipation(item.id)

      return [item.id, participation] as const
    }),
  )

  const map = { ...participations.value }

  for (const result of results) {
    if (result.status === 'fulfilled') {
      map[result.value[0]] = result.value[1]
    }
  }

  participations.value = map
}

onMounted(async () => {
  try {
    const items = await listAgendaItems()

    agendaItems.value = items

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    upcomingEvents.value = items
      .filter((item) => {
        const start = Date.parse(item.startsAt)

        return (
          item.cancelledAt == null &&
          Number.isFinite(start) &&
          start >= startOfToday.getTime()
        )
      })
      .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))

    void loadParticipations(items)
  } catch (error) {
    console.error('Erro ao carregar os próximos encontros:', error)
    agendaError.value = true
  } finally {
    agendaLoading.value = false
  }
})

function openEventDetails(item: AgendaItem) {
  detailsItems.value = [item]
  detailsHeading.value = undefined
  detailsOpen.value = true
}

function openDayDetails(payload: { date: Date; items: AgendaItem[] }) {
  detailsItems.value = payload.items
  detailsHeading.value = `Encontros de ${payload.date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
  })}`
  detailsOpen.value = true
}

function closeDetails() {
  detailsOpen.value = false
  detailsItems.value = []
  detailsHeading.value = undefined
}

function handleParticipationChange(payload: {
  id: string
  participation: AgendaParticipation
}) {
  participations.value = {
    ...participations.value,
    [payload.id]: payload.participation,
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

function eventTimeRange(item: AgendaItem): string {
  return `${formatHour(item.startsAt)} às ${formatHour(item.endsAt)}`
}

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
]
</script>

<template>
  <section
    class="dashboard-content flex w-full min-w-0 flex-col gap-[10px] px-[clamp(24px,5vw,75px)] pt-[15px] pb-8 max-[620px]:pt-6 max-[620px]:pb-10"
  >
    <div
      class="dashboard-grid grid min-w-0 grid-cols-[minmax(0,680fr)_minmax(0,690fr)] gap-[30px] max-[1400px]:grid-cols-1 max-[1400px]:gap-6"
    >
      <DashboardCalendar
        :items="agendaItems"
        :participations="participations"
        @select-day="openDayDetails"
      />

      <div
        class="flex min-w-0 flex-col gap-[5px] pt-[5px] max-[1400px]:grid max-[1400px]:grid-cols-2 max-[1400px]:gap-10 max-[1400px]:pt-0 max-[900px]:grid-cols-1"
      >
        <section class="dashboard-section community-section flex min-w-0 flex-col gap-[5px]">
          <header class="flex h-[54px] items-end justify-between gap-4">
            <div class="flex flex-col gap-[10px]">
              <p class="m-0 text-[14px] leading-4 font-medium text-text-2">DESCUBRA</p>
              <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
                Suas comunidades
              </h2>
            </div>
            <AppLink to="/dashboard/communities" size="h6">Ver todas</AppLink>
          </header>

          <div class="flex flex-col gap-[10px]">
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

        <section class="dashboard-section conversation-section flex min-w-0 flex-col gap-[5px]">
          <header class="flex h-[54px] items-end justify-between gap-4">
            <div class="flex flex-col gap-[10px]">
              <p class="m-0 text-[14px] leading-4 font-medium text-text-2">AGORA</p>
              <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
                Conversas recentes
              </h2>
            </div>
            <AppLink to="/dashboard/chat" size="h6">Ver todas</AppLink>
          </header>

          <div class="flex flex-col gap-[10px]">
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
                  <strong
                    class="min-w-0 truncate text-[18px] leading-[21px] font-medium text-text-1"
                  >
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
    </div>

    <section class="dashboard-section event-section flex min-w-0 flex-col gap-[10px]">
      <header class="flex h-[54px] items-end justify-between gap-4">
        <div class="flex flex-col gap-[10px]">
          <p class="m-0 text-[14px] leading-4 font-medium text-text-2">NÃO PERCA</p>
          <h2 class="m-0 text-[24px] leading-[28px] font-semibold text-text-1">
            Próximos encontros
          </h2>
        </div>
        <AppLink to="/dashboard/agenda" size="h4">Ver agenda</AppLink>
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
        v-else-if="!upcomingEvents.length"
        class="flex min-h-[148px] items-center rounded-2xl border border-dashed border-traceline bg-white p-6 text-[14px] leading-4 font-medium text-text-2"
      >
        Não há próximos encontros publicados.
      </div>

      <div v-else class="flex flex-col gap-[10px]">
        <article
          v-for="item in upcomingEvents"
          :key="item.id"
          class="event-card flex min-h-[148px] flex-wrap items-center gap-9 rounded-2xl border border-traceline bg-white p-6 max-[620px]:flex-col max-[620px]:items-stretch max-[620px]:gap-5"
        >
          <div
            class="grid h-24 w-20 shrink-0 place-content-center gap-2 rounded-[10px] bg-s-coral text-center text-co-blue"
          >
            <span class="text-[32px] leading-[38px] font-semibold">{{ formatDay(item.startsAt) }}</span>
            <span class="text-[14px] leading-4 font-medium uppercase">{{
              formatMonth(item.startsAt)
            }}</span>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-3">
            <div class="flex items-center gap-2 text-co-blue">
              <AppDashboardIcon
                :name="item.format === 'online' ? 'video' : 'calendar-days'"
                :size="16"
              />
              <span class="text-[14px] leading-4 font-medium uppercase">
                {{ item.format === 'online' ? 'ENCONTRO ONLINE' : 'ENCONTRO PRESENCIAL' }}
              </span>
            </div>

            <h3 class="m-0 text-[20px] leading-[23px] font-semibold text-text-1">
              {{ item.title }}
            </h3>

            <div class="flex flex-wrap items-center gap-5 text-text-2">
              <span class="flex items-center gap-2">
                <AppDashboardIcon name="coletive" :size="16" />
                <span class="text-[14px] leading-4 font-medium">
                  {{ item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
                </span>
              </span>

              <span class="flex items-center gap-2">
                <AppDashboardIcon name="clock" :size="16" />
                <span class="text-[14px] leading-4 font-medium">{{ eventTimeRange(item) }}</span>
              </span>
            </div>
          </div>

          <div class="ml-auto shrink-0 max-[620px]:ml-0">
            <AppButton
              variant="coral"
              :width="218"
              :height="50"
              centered
              :arrow="false"
              @click="openEventDetails(item)"
            >
              Detalhes
            </AppButton>
          </div>
        </article>
      </div>
    </section>

    <AgendaDetailsModal
      v-if="detailsOpen"
      :items="detailsItems"
      :heading="detailsHeading"
      @close="closeDetails"
      @participation-change="handleParticipationChange"
    />
  </section>
</template>
