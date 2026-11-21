<script setup lang="ts">
import { computed, ref } from 'vue'

import type { AgendaItem, AgendaParticipation } from '../services/agenda'
import { currentUser } from '../../../shared/services/session'
import AppDashboardIcon from '../../../shared/ui/AppDashboardIcon.vue'

/**
 * Figma — Dashboard Conecta > Calendário (851:308)
 *
 * Calendário mensal do Dashboard. Importa os encontros da Agenda e destaca:
 * - hoje, em azul (852:343);
 * - dias com interesse, presença ou encontro próprio, em coral (852:352);
 * - dias que têm encontro, com o indicador de 4px (852:354).
 *
 * Clicar em um dia com encontro emite `select-day` com todos os encontros
 * daquele dia para o popup de detalhes.
 */
const props = defineProps<{
  items: AgendaItem[]
  participations: Record<string, AgendaParticipation>
}>()

const emit = defineEmits<{
  'select-day': [payload: { date: Date; items: AgendaItem[] }]
}>()

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

type DayInfo = {
  items: AgendaItem[]
  interested: boolean
  confirmed: boolean
  owned: boolean
}

type CalendarDay = {
  day: number
  isToday: boolean
  hasEvent: boolean
  marked: boolean
  items: AgendaItem[]
  title?: string
}

const monthLabel = computed(() => {
  const label = new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  })

  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${viewYear.value}`
})

const todayLabel = computed(
  () => `${today.getDate()} ${today.toLocaleDateString('pt-BR', { month: 'short' })}`,
)

const daysInfo = computed(() => {
  const map = new Map<number, DayInfo>()

  for (const item of props.items) {
    if (item.cancelledAt) continue

    const start = new Date(item.startsAt)

    if (
      !Number.isFinite(start.getTime()) ||
      start.getFullYear() !== viewYear.value ||
      start.getMonth() !== viewMonth.value
    ) {
      continue
    }

    const day = start.getDate()
    const entry = map.get(day) ?? {
      items: [],
      interested: false,
      confirmed: false,
      owned: false,
    }
    entry.items.push(item)

    const participation = props.participations[item.id]
    if (participation) {
      entry.interested = entry.interested || participation.interested
      entry.confirmed = entry.confirmed || participation.confirmed
    }

    if (currentUser.user?.sub && item.organizerId === currentUser.user.sub) {
      entry.owned = true
    }

    map.set(day, entry)
  }

  return map
})

const days = computed<Array<CalendarDay | null>>(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const offset = first.getDay()
  const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells: Array<CalendarDay | null> = Array.from({ length: offset }, () => null)

  for (let day = 1; day <= total; day += 1) {
    const date = new Date(viewYear.value, viewMonth.value, day)
    const info = daysInfo.value.get(day)
    const marked = Boolean(info && (info.interested || info.confirmed || info.owned))
    const titles = info ? info.items.map((item) => item.title) : []

    if (info?.confirmed) {
      titles.push('Presença confirmada')
    } else if (info?.interested) {
      titles.push('Interesse marcado')
    }

    if (info?.owned) {
      titles.push('Organizado por você')
    }

    cells.push({
      day,
      isToday:
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate(),
      hasEvent: Boolean(info),
      marked,
      items: info?.items ?? [],
      title: titles.length ? titles.join(' · ') : undefined,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
})

function selectDay(day: CalendarDay) {
  if (!day.hasEvent) return

  emit('select-day', {
    date: new Date(viewYear.value, viewMonth.value, day.day),
    items: day.items,
  })
}

function previousMonth() {
  const date = new Date(viewYear.value, viewMonth.value - 1, 1)
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
}

function nextMonth() {
  const date = new Date(viewYear.value, viewMonth.value + 1, 1)
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
}

function goToToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
}
</script>

<template>
  <article
    class="flex min-w-0 flex-col gap-6 self-start rounded-2xl border border-traceline bg-white p-6 max-[620px]:gap-5 max-[620px]:p-5"
  >
    <header class="flex min-h-16 items-center justify-between gap-4 max-[620px]:flex-wrap">
      <div class="flex min-w-0 flex-col gap-[5px]">
        <p class="m-0 text-[14px] leading-4 font-medium text-text-2">SEU CALENDÁRIO</p>
        <h2 class="m-0 text-[24px] leading-7 font-semibold text-co-blue">
          {{ monthLabel }}
        </h2>
      </div>

      <div
        class="flex shrink-0 items-center gap-3 max-[620px]:w-full max-[620px]:justify-between"
      >
        <button
          type="button"
          class="h-8 rounded-lg bg-s-coral px-3 text-[14px] leading-4 font-medium whitespace-nowrap text-co-blue transition-colors duration-300 hover:bg-co-coral hover:text-co-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
          @click="goToToday"
        >
          Hoje, {{ todayLabel }}
        </button>

        <div class="flex items-center gap-3">
          <button
            type="button"
            aria-label="Mês anterior"
            class="grid size-9 place-items-center rounded-lg border border-traceline bg-co-white text-text-2 transition-colors duration-300 hover:border-s-blue hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
            @click="previousMonth"
          >
            <AppDashboardIcon name="chevron-right" :size="12" class="rotate-180" />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            class="grid size-9 place-items-center rounded-lg border border-traceline bg-co-white text-text-2 transition-colors duration-300 hover:border-s-blue hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
            @click="nextMonth"
          >
            <AppDashboardIcon name="chevron-right" :size="12" />
          </button>
        </div>
      </div>
    </header>

    <div
      class="grid grid-cols-7 gap-[6px] rounded-[15px] border border-traceline bg-co-white px-[1px] py-3"
      aria-hidden="true"
    >
      <span
        v-for="weekday in WEEKDAYS"
        :key="weekday"
        class="text-center text-[14px] leading-4 font-medium text-text-2 max-[620px]:text-[12px]"
      >
        {{ weekday }}
      </span>
    </div>

    <div
      class="grid grid-cols-7 gap-[6px] rounded-[15px] border border-traceline bg-co-white p-[1px] max-[620px]:gap-1"
      role="grid"
      :aria-label="monthLabel"
    >
      <div
        v-for="(day, index) in days"
        :key="index"
        class="flex h-[67px] items-center justify-center max-[620px]:h-12"
        role="gridcell"
      >
        <button
          v-if="day"
          type="button"
          :disabled="!day.hasEvent"
          class="relative grid size-[46px] place-items-center rounded-xl text-[16px] leading-none font-medium transition-[background-color,color,box-shadow,transform,scale] duration-200 ease-out motion-reduce:transition-none max-[620px]:size-9"
          :class="[
            day.marked
              ? 'bg-s-coral text-co-blue hover:scale-[1.06] hover:bg-co-coral hover:text-co-white hover:shadow-[0_6px_16px_rgba(236,118,93,0.35)]'
              : day.isToday
                ? 'bg-co-blue text-co-white hover:scale-[1.06] hover:shadow-[0_6px_16px_rgba(38,59,115,0.35)]'
                : day.hasEvent
                  ? 'text-text-1 hover:scale-[1.06] hover:bg-s-coral hover:text-co-blue hover:shadow-[0_6px_16px_rgba(236,118,93,0.25)]'
                  : 'text-text-1 hover:bg-s-blue/30 hover:text-co-blue',
            day.hasEvent
              ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue'
              : 'cursor-default',
          ]"
          :title="day.title"
          :aria-label="day.hasEvent ? `Ver encontros do dia ${day.day}` : undefined"
          @click="selectDay(day)"
        >
          {{ day.day }}
          <span
            v-if="day.hasEvent"
            class="absolute bottom-[9px] left-1/2 size-1 -translate-x-1/2 rounded-full max-[620px]:bottom-1.5"
            :class="day.isToday && !day.marked ? 'bg-co-white' : 'bg-co-blue'"
          />
        </button>
      </div>
    </div>
  </article>
</template>
