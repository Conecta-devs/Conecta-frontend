<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  getAgendaItem,
  getMyAgendaParticipation,
  updateAgendaAttendance,
  updateAgendaInterest,
  type AgendaItem,
  type AgendaParticipation,
} from '../services/agenda'
import { currentUser } from '../../../shared/services/session'

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
  loading: boolean
  error: string
  savingInterest: boolean
  savingAttendance: boolean
}

const entries = ref<Entry[]>([])

function isOrganizer(item: AgendaItem): boolean {
  return Boolean(currentUser.user?.sub) && item.organizerId === currentUser.user?.sub
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

let loadToken = 0

async function loadEntries() {
  const token = ++loadToken

  entries.value = props.items.map<Entry>((item) => ({
    item,
    participation: null,
    loading: true,
    error: '',
    savingInterest: false,
    savingAttendance: false,
  }))

  await Promise.all(
    entries.value.map(async (entry) => {
      try {
        const [details, participation] = await Promise.all([
          getAgendaItem(entry.item.id).catch(() => entry.item),
          getMyAgendaParticipation(entry.item.id),
        ])

        if (token !== loadToken) return

        entry.item = details
        entry.participation = participation
        emit('participation-change', { id: entry.item.id, participation })
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
  <div
    class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#101827]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
    @click.self="emit('close')"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="agenda-details-title"
      class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]"
    >
      <header
        class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-traceline bg-white px-5 py-4 sm:px-7"
      >
        <div class="min-w-0">
          <p class="m-0 text-[12px] leading-4 font-medium tracking-wide text-co-coral uppercase">
            Agenda
            <template v-if="items.length > 1"> · {{ items.length }} encontros</template>
          </p>
          <h2
            id="agenda-details-title"
            class="m-0 mt-1 font-display text-[24px] leading-7 font-bold text-co-blue"
          >
            {{ heading ?? 'Detalhes do encontro' }}
          </h2>
        </div>

        <button
          type="button"
          class="shrink-0 rounded-lg px-3 py-2 text-[14px] leading-4 font-medium text-text-2 transition-colors duration-200 hover:bg-co-white hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
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
          class="flex min-w-0 flex-col gap-4 rounded-xl border border-traceline bg-co-white p-4 sm:p-5"
        >
          <header class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="m-0 text-[12px] leading-4 font-medium tracking-wide text-co-coral uppercase">
                {{ entry.item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
                · {{ entry.item.format === 'online' ? 'Online' : 'Presencial' }}
              </p>
              <h3 class="m-0 mt-1 text-[20px] leading-[23px] font-semibold text-text-1">
                {{ entry.item.title }}
              </h3>
              <p class="m-0 mt-1 text-[14px] leading-5 font-medium text-text-2">
                {{ formatDateTime(entry.item.startsAt) }} – {{ formatDateTime(entry.item.endsAt) }}
              </p>
            </div>

            <span
              v-if="isOrganizer(entry.item)"
              class="shrink-0 rounded-md bg-s-coral px-2 py-1 text-[12px] leading-4 font-medium text-co-blue"
            >
              Organizado por você
            </span>
          </header>

          <p class="m-0 text-[14px] leading-6 break-words whitespace-pre-wrap text-text-1">
            {{ entry.item.description }}
          </p>

          <a
            v-if="entry.item.format === 'online' && entry.item.meetingUrl"
            :href="entry.item.meetingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[14px] leading-5 font-semibold break-all text-co-blue underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
          >
            Abrir link da reunião
          </a>

          <p
            v-if="entry.item.format === 'in_person' && entry.item.location"
            class="m-0 text-[14px] leading-5 text-text-2"
          >
            Local: {{ entry.item.location }}
          </p>

          <p v-if="entry.loading" role="status" class="m-0 text-[14px] leading-5 text-text-2">
            Carregando participação...
          </p>

          <p v-if="entry.error" role="alert" class="m-0 text-[14px] leading-5 text-co-coral">
            {{ entry.error }}
          </p>

          <div v-if="entry.participation" class="grid gap-3 sm:grid-cols-2">
            <section class="flex flex-col rounded-lg border border-traceline bg-white p-4">
              <h4 class="m-0 text-[16px] leading-5 font-semibold text-co-blue">Interesse</h4>
              <p class="m-0 mt-1 text-[14px] leading-5 text-text-2">
                {{
                  entry.participation.interested
                    ? 'Você tem interesse.'
                    : 'Você ainda não marcou interesse.'
                }}
              </p>
              <button
                type="button"
                class="mt-3 self-start rounded-lg border border-traceline bg-white px-3 py-2 text-[14px] leading-4 font-medium text-co-blue transition-colors duration-200 hover:border-s-blue hover:bg-co-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
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

            <section class="flex flex-col rounded-lg border border-traceline bg-white p-4">
              <h4 class="m-0 text-[16px] leading-5 font-semibold text-co-blue">Presença</h4>
              <p class="m-0 mt-1 text-[14px] leading-5 text-text-2">
                {{
                  entry.participation.confirmed
                    ? 'Sua presença está confirmada.'
                    : 'Sua presença não está confirmada.'
                }}
              </p>
              <button
                type="button"
                class="mt-3 self-start rounded-lg border border-traceline bg-white px-3 py-2 text-[14px] leading-4 font-medium text-co-blue transition-colors duration-200 hover:border-s-blue hover:bg-co-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
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
            v-if="showOrganizerActions && isOrganizer(entry.item)"
            class="flex flex-wrap justify-end gap-2 border-t border-traceline pt-4"
          >
            <button
              type="button"
              class="rounded-lg border border-traceline px-4 py-2 text-[14px] leading-4 font-medium text-co-blue transition-colors duration-200 hover:border-s-blue hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
              @click="emit('edit', entry.item)"
            >
              Editar encontro
            </button>
            <button
              type="button"
              class="rounded-lg border border-co-coral/40 px-4 py-2 text-[14px] leading-4 font-medium text-co-coral transition-colors duration-200 hover:bg-s-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-coral"
              @click="emit('cancel', entry.item)"
            >
              Cancelar encontro
            </button>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>
