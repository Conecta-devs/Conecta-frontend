<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  faArrowRight,
  faCalendarDays,
  faChevronRight,
  faUsers,
  faCheckCircle,
  faHeart,
} from '@fortawesome/free-solid-svg-icons'
import {
  getMyAgendaParticipation,
  listAgendaItems,
  type AgendaItem,
} from '../services/agenda'

type AgendaSummaryItem = {
  item: AgendaItem
  interested: boolean
  confirmed: boolean
}

const upcomingAgendaItems = ref<AgendaSummaryItem[]>([])
const agendaSummaryLoading = ref(true)
const agendaSummaryError = ref(false)




onMounted(async () => {
  try {
    const now = Date.now()
    const items = await listAgendaItems()

    // Mantém somente eventos futuros que não foram cancelados.
    const futureItems = items.filter((item) => {
      const start = Date.parse(item.startsAt)

      return (
        item.cancelledAt == null &&
        Number.isFinite(start) &&
        start >= now
      )
    })

    // Consulta a participação do usuário em cada evento.
    const results = await Promise.allSettled(
      futureItems.map(async (item) => ({
        item,
        participation: await getMyAgendaParticipation(item.id),
      })),
    )

    const personalizedItems = results
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          item: AgendaItem
          participation: Awaited<
            ReturnType<typeof getMyAgendaParticipation>
          >
        }> => result.status === 'fulfilled',
      )
      .map((result) => result.value)
      .filter(
        ({ participation }) =>
          participation.confirmed || participation.interested,
      )
      .sort((left, right) => {
        const leftPriority = left.participation.confirmed ? 0 : 1
        const rightPriority = right.participation.confirmed ? 0 : 1

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        return (
          Date.parse(left.item.startsAt) -
          Date.parse(right.item.startsAt)
        )
      })

    upcomingAgendaItems.value = personalizedItems
      .slice(0, 3)
      .map(({ item, participation }) => ({
        item,
        interested: participation.interested,
        confirmed: participation.confirmed,
      }))
  } catch (error) {
    console.error('Erro ao carregar resumo da Agenda:', error)
    agendaSummaryError.value = true
  } finally {
    agendaSummaryLoading.value = false
  }
})



function formatAgendaStart(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const communities = [
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
  { name: '{group_name}', members: '{members_counter}', color: '{color}' },
]

const conversations = [
  {
    name: '{name}',
    text: '{text}',
    time: '{last_time}',
    initials: '{Initia}',
    color: '{color_profile}',
  },
  {
    name: '{group_name}',
    text: '{last_chat}',
    time: '{last_time}',
    initials: '{initia}', // Initial tá
    color: '{color}',
  },
  {
    name: '{name}',
    text: '{text}',
    time: '{last_time}',
    initials: '{Initia}',
    color: '{color}',
  },
]
</script>

<template>
  <section
    class="dashboard-content mx-auto w-full min-w-0 max-w-[1240px] px-[clamp(24px,5vw,70px)] pb-[60px] pt-[38px] max-[620px]:px-[18px] max-[620px]:py-[25px]"
  >
    <div
      class="dashboard-grid mt-[37px] grid min-w-0 grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] gap-[22px] max-[960px]:grid-cols-1"
    >
      <section class="dashboard-section community-section min-w-0" id="comunidades">
        <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
          <div>
            <p
              class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-text-2"
            >
              Descubra
            </p>
            <h2
              class="text-h2 mt-1"
            >
              Suas comunidades
            </h2>
          </div>
          <a
            class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-text-2 no-underline"
            href="#comunidades"
            >Ver todas <font-awesome-icon :icon="faChevronRight"
          /></a>
        </div>
        <div class="community-list flex flex-col gap-2">
          <article
            v-for="community in communities"
            :key="community.name"
            class="community-card flex items-center gap-3 rounded-xl border border-traceline bg-co-white p-[13px]"
          >
            <div
              class="community-symbol grid size-[42px] place-items-center rounded-[11px]"
              :class="
                community.color === 'coral'
                  ? 'bg-s-coral text-co-coral'
                  : community.color === 'blue'
                    ? 'bg-s-blue text-co-blue'
                    : 'bg-tree-bg text-text-2'
              "
            >
              <font-awesome-icon :icon="faUsers" />
            </div>
            <div class="community-copy min-w-0 flex-1">
              <h3 class="text-h3 m-0">{{ community.name }}</h3>
              <p class="mt-1 text-[10px] text-text-2">{{ community.members }}</p>
            </div>
            <button
              class="small-icon-button grid size-[30px] place-items-center rounded-lg border-0 bg-traceline text-text-2"
              :aria-label="`Abrir ${community.name}`"
            >
              <font-awesome-icon :icon="faArrowRight" />
            </button>
          </article>
        </div>
      </section>
      <section class="dashboard-section conversation-section min-w-0">
        <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
          <div>
            <p
              class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-text-2"
            >
              Agora
            </p>
            <h2
              class="text-h2 mt-1"
            >
              Conversas recentes
            </h2>
          </div>
          <a
            class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-text-2 no-underline"
            href="#conversas"
            >Ver todas <font-awesome-icon :icon="faChevronRight"
          /></a>
        </div>
        <div class="conversation-list flex flex-col gap-2" id="conversas">
          <article
            v-for="conversation in conversations"
            :key="conversation.name"
            class="conversation-item flex items-center gap-[11px] rounded-xl border border-traceline bg-co-white p-3"
          >
            <div
              class="profile-avatar grid size-[34px] shrink-0 place-items-center rounded-full text-[10px] font-bold"
              :class="
                conversation.color === 'coral'
                  ? 'bg-s-coral text-co-coral'
                  : conversation.color === 'blue'
                    ? 'bg-s-blue text-co-blue'
                    : 'bg-s-green text-tree-green' //Tem que mudar depois as opções mas na base é isso
              "
            >
              {{ conversation.initials }}
            </div>
            <div class="conversation-copy min-w-0 flex-1">
              <h3 class="text-h3 m-0">{{ conversation.name }}</h3>
              <p class="mt-1 truncate text-[10px] text-text-2">{{ conversation.text }}</p>
            </div>
            <time class="self-start text-[10px] text-text-2">{{ conversation.time }}</time>
          </article>
        </div>
      </section>
    </div>

    <section class="dashboard-section event-section mt-[37px]">
      <div class="section-heading mb-[17px] flex items-end justify-between gap-4">
        <div>
          <p
            class="section-kicker m-0 text-[10px] font-bold uppercase tracking-[1.1px] text-text-2"
          >
            Não perca
          </p>
          <h2 class="text-h2 mt-1">
            Próximos encontros
          </h2>
        </div>
        <RouterLink
          class="section-link flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-text-2 no-underline"
          to="/dashboard/agenda"
          >Ver agenda <font-awesome-icon :icon="faChevronRight"
        /></RouterLink>
      </div>
      <div
        v-if="agendaSummaryLoading"
        class="rounded-xl border border-traceline bg-co-white p-5 text-sm text-text-2"
        role="status"
      >
        Carregando próximos encontros...
      </div>
      <div
        v-else-if="agendaSummaryError"
        class="rounded-xl border border-traceline bg-co-white p-5 text-sm text-text-2"
        role="status"
      >
        Não foi possível carregar a Agenda agora.
      </div>
      <div
        v-else-if="upcomingAgendaItems.length === 0"
        class="rounded-xl border border-dashed border-traceline bg-co-white p-5 text-sm text-text-2"
      >
        Não há próximos encontros publicados.
      </div>
      <div v-else class="space-y-2">
        <article
          v-for="entry in upcomingAgendaItems"
          :key="entry.item.id"
          class="flex min-w-0 items-start gap-3 rounded-xl border border-traceline bg-co-white p-4"
        >
          <div
            class="grid size-10 shrink-0 place-items-center rounded-lg bg-s-coral text-co-coral"
          >
            <font-awesome-icon :icon="faCalendarDays" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-co-coral">
              {{ entry.item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
              · {{ entry.item.format === 'online' ? 'Online' : 'Presencial' }}
            </p>

            <h3 class="text-h6 mt-1 break-words text-co-blue">
              {{ entry.item.title }}
            </h3>

            <p class="mt-1 text-xs text-text-2">
              {{ formatAgendaStart(entry.item.startsAt) }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="entry.confirmed"
                class="inline-flex items-center gap-1 rounded-full bg-s-green px-2.5 py-1 text-[11px] font-semibold text-tree-green"
              >
                <font-awesome-icon :icon="faCheckCircle" />
                Presença confirmada
              </span>

              <span
                v-if="entry.interested"
                class="inline-flex items-center gap-1 rounded-full bg-s-coral px-2.5 py-1 text-[11px] font-semibold text-co-coral"
              >
                <font-awesome-icon :icon="faHeart" />
                Tenho interesse
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped></style>
