<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  getAgendaItem,
  getMyAgendaParticipation,
  listAgendaParticipants,
  updateAgendaAttendance,
  updateAgendaInterest,
  type AgendaAttendee,
  type AgendaItem,
  type AgendaParticipation,
} from '@/features/dashboard/services/agenda'
import { currentUser } from '@/shared/services/session'
import { formatDateTime, isOrganizer } from '@/features/dashboard/utils/format'
import calendarEvent from '@/features/dashboard/assets/agenda/calendar-event.svg'
import AsyncState from './AsyncState.vue'
import AppModal from './AppModal.vue'
import UserAvatar from './UserAvatar.vue'

/**
 * Popup de detalhes de encontros da Agenda.
 *
 * Recebe um ou mais encontros: o Dashboard usa com um item (card de próximo
 * encontro) e com todos os itens de um dia (clique no calendário); a Agenda
 * usa com o encontro selecionado. O conteúdo rola quando há vários encontros.
 *
 * Dentro do popup é possível marcar interesse e confirmar presença. Quando
 * `showOrganizerActions` está ativo, o organizador também vê editar/cancelar.
 */
const props = withDefaults(
  defineProps<{
    items: AgendaItem[]
    /** Título exibido no cabeçalho. Padrão: "Detalhes do encontro". */
    heading?: string
    /** Exibe as ações de organização (editar/cancelar) para quem criou. */
    showOrganizerActions?: boolean
  }>(),
  {
    heading: undefined,
    showOrganizerActions: false,
  },
)

const emit = defineEmits<{
  close: []
  edit: [item: AgendaItem]
  cancel: [item: AgendaItem]
  'participation-change': [payload: { id: string; participation: AgendaParticipation }]
}>()

type Entry = {
  item: AgendaItem
  participation: AgendaParticipation | null
  attendees: AgendaAttendee[]
  loading: boolean
  error: string
  savingInterest: boolean
  savingAttendance: boolean
}

const entries = ref<Entry[]>([])

let loadToken = 0

async function loadEntries() {
  const token = ++loadToken

  entries.value = props.items.map<Entry>((item) => ({
    item,
    participation: null,
    attendees: [],
    loading: true,
    error: '',
    savingInterest: false,
    savingAttendance: false,
  }))

  await Promise.all(
    entries.value.map(async (entry) => {
      try {
        const details = await getAgendaItem(entry.item.id).catch(() => entry.item)

        if (token !== loadToken) return

        entry.item = details

        const own = isOrganizer(details, currentUser.user?.sub)

        if (own) {
          try {
            const attendees = await listAgendaParticipants(details.id)
            if (token !== loadToken) return
            entry.attendees = attendees
          } catch {
            if (token !== loadToken) return
            entry.error = 'Não foi possível carregar as presenças confirmadas.'
          }
        } else {
          const participation = await getMyAgendaParticipation(entry.item.id)
          if (token !== loadToken) return
          entry.participation = participation
          emit('participation-change', { id: entry.item.id, participation })
        }
      } catch (error) {
        if (token !== loadToken) return

        entry.error =
          error instanceof Error ? error.message : 'Não foi possível carregar os detalhes.'
      } finally {
        if (token === loadToken) {
          entry.loading = false
        }
      }
    }),
  )
}

watch(() => props.items, loadEntries, { immediate: true })

async function setInterest(entry: Entry, interested: boolean) {
  if (!entry.participation || entry.savingInterest) return

  entry.savingInterest = true
  entry.error = ''

  try {
    const participation = await updateAgendaInterest(entry.item.id, interested)
    entry.participation = participation
    emit('participation-change', { id: entry.item.id, participation })
  } catch (error) {
    entry.error =
      error instanceof Error ? error.message : 'Não foi possível atualizar o interesse.'
  } finally {
    entry.savingInterest = false
  }
}

async function setAttendance(entry: Entry, confirmed: boolean) {
  if (!entry.participation || entry.savingAttendance) return

  entry.savingAttendance = true
  entry.error = ''

  try {
    const participation = await updateAgendaAttendance(entry.item.id, confirmed)
    entry.participation = participation
    emit('participation-change', { id: entry.item.id, participation })
  } catch (error) {
    entry.error =
      error instanceof Error ? error.message : 'Não foi possível atualizar a presença.'
  } finally {
    entry.savingAttendance = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <AppModal
    labelled-by="agenda-details-title"
    max-width="2xl"
    @backdrop="emit('close')"
  >
      <header
        class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-traceline bg-co-white px-5 py-4 sm:px-7"
      >
        <div class="min-w-0">
          <p class="m-0 text-h6 font-medium text-co-blue uppercase">
            Agenda
            <template v-if="items.length > 1"> · {{ items.length }} encontros</template>
          </p>
          <h2 id="agenda-details-title" class="m-0 mt-1 text-h3 font-semibold text-co-blue">
            {{ heading ?? 'Detalhes do encontro' }}
          </h2>
        </div>

        <button
          type="button"
          class="shrink-0 rounded-button px-3 py-2 text-h6 font-medium text-text-2 transition-colors hover:bg-s-blue/30 hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
          aria-label="Fechar detalhes"
          @click="emit('close')"
        >
          Fechar
        </button>
      </header>

      <div class="flex flex-col gap-4 px-5 py-5 sm:px-7">
        <article
          v-for="entry in entries"
          :key="entry.item.id"
          class="flex min-w-0 flex-col gap-4 rounded-card border border-traceline bg-co-white p-5"
        >
          <header class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="m-0 text-h6 font-medium text-co-coral uppercase">
                {{ entry.item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
                · {{ entry.item.format === 'online' ? 'Online' : 'Presencial' }}
              </p>
              <h3 class="m-0 mt-1 break-words text-h3 font-semibold text-text-1">
                {{ entry.item.title }}
              </h3>
              <div class="mt-1 flex items-center gap-2.5">
                <span class="relative block h-[15.804px] w-[14.222px] shrink-0 overflow-hidden">
                  <img :src="calendarEvent" alt=""
                    class="absolute inset-0 block h-full w-full max-w-none" />
                </span>
                <p class="m-0 text-h6 font-medium text-text-2">
                  {{ formatDateTime(entry.item.startsAt) }} – {{ formatDateTime(entry.item.endsAt) }}
                </p>
              </div>
            </div>

            <span
              v-if="isOrganizer(entry.item, currentUser.user?.sub)"
              class="shrink-0 rounded-md bg-s-coral px-2.5 py-1.5 text-h6 font-medium text-co-blue"
            >
              Organizado por você
            </span>
            <p
              v-else-if="entry.item.organizer?.name"
              class="m-0 text-h6 leading-normal text-text-2"
            >
              Organizado por {{ entry.item.organizer.name }}
            </p>
            <p v-else class="m-0 text-h6 leading-normal text-text-2">
              Organizado por um estudante
            </p>
          </header>

          <p class="m-0 text-h6 font-medium leading-6 break-words whitespace-pre-wrap text-text-1">
            {{ entry.item.description }}
          </p>

          <a
            v-if="entry.item.format === 'online' && entry.item.meetingUrl"
            :href="entry.item.meetingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-h6 font-medium break-all text-co-blue underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
          >
            Abrir link da reunião
          </a>

          <p
            v-if="entry.item.format === 'in_person' && entry.item.location"
            class="m-0 text-h6 font-medium text-text-2"
          >
            Local: {{ entry.item.location }}
          </p>

          <AsyncState
            v-if="entry.loading"
            kind="loading"
            message="Carregando participação..."
            class="m-0 text-h6 font-medium"
          />

          <AsyncState
            v-if="entry.error"
            kind="error"
            :message="entry.error"
            class="m-0 text-h6 font-medium"
          />

          <section
            v-if="isOrganizer(entry.item, currentUser.user?.sub)"
            class="flex flex-col rounded-button border border-traceline bg-white p-4"
          >
            <h4 class="m-0 text-h5 font-semibold text-co-blue">
              Presença confirmada · {{ entry.attendees.length }}
            </h4>
            <ul v-if="entry.attendees.length" class="m-0 mt-3 flex flex-col gap-2 list-none p-0">
              <li
                v-for="attendee in entry.attendees"
                :key="attendee.userId"
                class="flex items-center gap-2"
              >
                <span class="size-8 overflow-hidden rounded-full">
                  <UserAvatar :name="attendee.name" :image="attendee.image" />
                </span>
                <span class="text-h6 font-medium text-text-1">{{ attendee.name }}</span>
              </li>
            </ul>
            <p
              v-else-if="!entry.error"
              class="m-0 mt-1 text-h6 font-medium text-text-2"
            >
              Nenhuma presença confirmada ainda.
            </p>
          </section>

          <div v-else-if="entry.participation" class="grid gap-3 sm:grid-cols-2">
            <section class="flex flex-col rounded-button border border-traceline bg-white p-4">
              <h4 class="m-0 text-h5 font-semibold text-co-blue">Interesse</h4>
              <p class="m-0 mt-1 text-h6 font-medium text-text-2">
                {{
                  entry.participation.interested
                    ? 'Você tem interesse.'
                    : 'Você ainda não marcou interesse.'
                }}
              </p>
              <button
                type="button"
                class="mt-3 self-start rounded-button border border-traceline bg-co-white px-3 py-2 text-h6 font-medium text-co-blue transition-colors hover:border-s-blue hover:bg-s-blue/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
                :disabled="entry.savingInterest || entry.savingAttendance"
                @click="setInterest(entry, !entry.participation.interested)"
              >
                {{
                  entry.savingInterest
                    ? 'Atualizando...'
                    : entry.participation.interested
                      ? 'Remover interesse'
                      : 'Tenho interesse'
                }}
              </button>
            </section>

            <section class="flex flex-col rounded-button border border-traceline bg-white p-4">
              <h4 class="m-0 text-h5 font-semibold text-co-blue">Presença</h4>
              <p class="m-0 mt-1 text-h6 font-medium text-text-2">
                {{
                  entry.participation.confirmed
                    ? 'Sua presença está confirmada.'
                    : 'Sua presença não está confirmada.'
                }}
              </p>
              <button
                type="button"
                class="mt-3 self-start rounded-button border border-traceline bg-co-white px-3 py-2 text-h6 font-medium text-co-blue transition-colors hover:border-s-blue hover:bg-s-blue/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
                :disabled="entry.savingAttendance || entry.savingInterest"
                @click="setAttendance(entry, !entry.participation.confirmed)"
              >
                {{
                  entry.savingAttendance
                    ? 'Atualizando...'
                    : entry.participation.confirmed
                      ? 'Retirar confirmação'
                      : 'Confirmar presença'
                }}
              </button>
            </section>
          </div>

          <footer
            v-if="showOrganizerActions && isOrganizer(entry.item, currentUser.user?.sub)"
            class="flex flex-wrap justify-end gap-2 border-t border-traceline pt-4"
          >
            <button
              type="button"
              class="h-[50px] rounded-button border border-co-blue bg-co-white px-4 text-h6 font-medium text-co-blue transition-colors hover:bg-s-blue/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
              @click="emit('edit', entry.item)"
            >
              Editar encontro
            </button>
            <button
              type="button"
              class="h-[50px] rounded-button border border-co-coral bg-co-white px-4 text-h6 font-medium text-co-coral transition-colors hover:bg-s-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-coral"
              @click="emit('cancel', entry.item)"
            >
              Cancelar encontro
            </button>
          </footer>
        </article>
      </div>
  </AppModal>
</template>
