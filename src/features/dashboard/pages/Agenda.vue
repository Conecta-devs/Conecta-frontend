<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons'
import {
    cancelAgendaItem,
    createAgendaItem,
    getAgendaItem,
    getMyAgendaParticipation,
    listAgendaItems,
    updateAgendaAttendance,
    updateAgendaInterest,
    updateAgendaItem,
    type AgendaFormat,
    type AgendaItem,
    type AgendaItemInput,
    type AgendaKind,
    type AgendaParticipation,
} from '../services/agenda'
import { getUserProfile } from '../../auth/services/auth'
import { currentUser, saveSession } from '../../../shared/services/session'

interface AgendaForm {
    title: string
    description: string
    kind: AgendaKind
    format: AgendaFormat
    startsAt: string
    endsAt: string
    meetingUrl: string
    location: string
}

const emptyForm = (): AgendaForm => ({
    title: '',
    description: '',
    kind: 'event',
    format: 'online',
    startsAt: '',
    endsAt: '',
    meetingUrl: '',
    location: '',
})

const agendaItems = ref<AgendaItem[]>([])
const loading = ref(true)
const loadError = ref('')
const identityWarning = ref('')
const successMessage = ref('')
const formError = ref('')
const detailError = ref('')
const formOpen = ref(false)
const formSaving = ref(false)
const editingAgendaId = ref<string | null>(null)
const form = ref<AgendaForm>(emptyForm())
const selectedAgenda = ref<AgendaItem | null>(null)
const participation = ref<AgendaParticipation | null>(null)
const detailsLoading = ref(false)
const interestSaving = ref(false)
const attendanceSaving = ref(false)
const cancellingAgendaId = ref<string | null>(null)
const agendaToCancel = ref<AgendaItem | null>(null)

const isEditing = computed(() => editingAgendaId.value !== null)

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

function toDateTimeLocal(value: string): string {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ''

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    return localDate.toISOString().slice(0, 16)
}

async function hydrateOrganizerIdentity() {
    if (currentUser.user?.sub) return

    try {
        const profile = await getUserProfile()
        const user = currentUser.user
        if (profile.sub && user) {
            saveSession({ ...user, sub: profile.sub })
            return
        }
    } catch {
        identityWarning.value =
            'Não foi possível confirmar sua identidade agora. As ações de organização ficam indisponíveis.'
        return
    }

    identityWarning.value =
        'Não foi possível confirmar sua identidade. As ações de organização ficam indisponíveis.'
}

async function loadAgenda() {
    loading.value = true
    loadError.value = ''

    try {
        const items = await listAgendaItems()
        agendaItems.value = items
            .filter((item) => item.cancelledAt === null)
            .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))

        await hydrateOrganizerIdentity()
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Não foi possível carregar a Agenda.'
    } finally {
        loading.value = false
    }
}

async function openDetails(item: AgendaItem) {
    selectedAgenda.value = item
    participation.value = null
    detailError.value = ''
    detailsLoading.value = true

    try {
        const [details, myParticipation] = await Promise.all([
            getAgendaItem(item.id),
            getMyAgendaParticipation(item.id),
        ])
        if (selectedAgenda.value?.id !== item.id) return
        selectedAgenda.value = details
        participation.value = myParticipation
    } catch (error) {
        detailError.value =
            error instanceof Error ? error.message : 'Não foi possível carregar os detalhes.'
    } finally {
        detailsLoading.value = false
    }
}

function closeDetails() {
    selectedAgenda.value = null
    participation.value = null
    detailError.value = ''
}

function beginCreate() {
    form.value = emptyForm()
    editingAgendaId.value = null
    formError.value = ''
    successMessage.value = ''
    formOpen.value = true
}

function beginEdit(item: AgendaItem) {
    if (!isOrganizer(item)) return

    form.value = {
        title: item.title,
        description: item.description,
        kind: item.kind,
        format: item.format,
        startsAt: toDateTimeLocal(item.startsAt),
        endsAt: toDateTimeLocal(item.endsAt),
        meetingUrl: item.meetingUrl ?? '',
        location: item.location ?? '',
    }
    editingAgendaId.value = item.id
    formError.value = ''
    successMessage.value = ''
    formOpen.value = true
    closeDetails()
}

function closeForm() {
    if (formSaving.value) return
    formOpen.value = false
    editingAgendaId.value = null
    form.value = emptyForm()
    formError.value = ''
}

function buildAgendaInput(): AgendaItemInput {
    const startsAt = new Date(form.value.startsAt)
    const endsAt = new Date(form.value.endsAt)

    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
        throw new Error('Informe datas e horários válidos.')
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
        throw new Error('O horário final precisa ser posterior ao inicial.')
    }
    if (form.value.format === 'in_person' && !form.value.location.trim()) {
        throw new Error('Informe o local do encontro presencial.')
    }

    return {
        title: form.value.title.trim(),
        description: form.value.description.trim(),
        kind: form.value.kind,
        format: form.value.format,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        meetingUrl: form.value.format === 'online' ? form.value.meetingUrl.trim() || null : null,
        location: form.value.format === 'in_person' ? form.value.location.trim() : null,
    }
}

async function saveAgendaItem() {
    formError.value = ''
    successMessage.value = ''

    if (!form.value.title.trim() || !form.value.description.trim()) {
        formError.value = 'Título e descrição são obrigatórios.'
        return
    }

    if (form.value.title.trim().length > 150) {
        formError.value = 'O título deve ter no máximo 150 caracteres.'
        return
    }
    if (form.value.description.trim().length > 5000) {
        formError.value = 'A descrição deve ter no máximo 5000 caracteres.'
        return
    }

    formSaving.value = true
    try {
        const input = buildAgendaInput()
        if (editingAgendaId.value) {
            await updateAgendaItem(editingAgendaId.value, input)
            successMessage.value = 'Encontro atualizado com sucesso.'
        } else {
            await createAgendaItem(input)
            successMessage.value = 'Encontro criado com sucesso.'
        }

        formOpen.value = false
        editingAgendaId.value = null
        form.value = emptyForm()
        await loadAgenda()
    } catch (error) {
        formError.value = error instanceof Error ? error.message : 'Não foi possível salvar o encontro.'
    } finally {
        formSaving.value = false
    }
}

async function setInterest(interested: boolean) {
    if (!selectedAgenda.value || !participation.value || interestSaving.value) return

    interestSaving.value = true
    detailError.value = ''
    try {
        participation.value = await updateAgendaInterest(selectedAgenda.value.id, interested)
    } catch (error) {
        detailError.value =
            error instanceof Error ? error.message : 'Não foi possível atualizar o interesse.'
    } finally {
        interestSaving.value = false
    }
}

async function setAttendance(confirmed: boolean) {
    if (!selectedAgenda.value || !participation.value || attendanceSaving.value) return

    attendanceSaving.value = true
    detailError.value = ''
    try {
        participation.value = await updateAgendaAttendance(selectedAgenda.value.id, confirmed)
    } catch (error) {
        detailError.value =
            error instanceof Error ? error.message : 'Não foi possível atualizar a presença.'
    } finally {
        attendanceSaving.value = false
    }
}


function cancelItem(item: AgendaItem) {
    if (!isOrganizer(item) || cancellingAgendaId.value) return

    agendaToCancel.value = item
}

function closeCancelModal() {
    if (cancellingAgendaId.value) return

    agendaToCancel.value = null
}

async function confirmCancelAgenda() {
    const item = agendaToCancel.value

    if (!item || !isOrganizer(item) || cancellingAgendaId.value) return

    cancellingAgendaId.value = item.id
    loadError.value = ''
    successMessage.value = ''

    try {
        const cancelled = await cancelAgendaItem(item.id)

        agendaItems.value = agendaItems.value.filter(
            (entry) => entry.id !== cancelled.id,
        )

        successMessage.value = 'Encontro cancelado com sucesso.'

        if (selectedAgenda.value?.id === item.id) {
            closeDetails()
        }

        agendaToCancel.value = null
    } catch (error) {
        loadError.value =
            error instanceof Error
                ? error.message
                : 'Não foi possível cancelar o encontro.'
    } finally {
        cancellingAgendaId.value = null
    }
}

onMounted(loadAgenda)
</script>

<template>
    <section class="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <header class="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="mb-2 text-sm font-semibold text-[#e8755f]">CONECTA · COMUNIDADE</p>
                <h1 class="font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#253b73]">Agenda</h1>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-[#6f7a8d]">
                    Encontros, eventos e conversas da comunidade estudantil.
                </p>
            </div>

            <button type="button"
                class="rounded-lg bg-[#253b73] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d2f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                @click="beginCreate">
                Criar encontro
            </button>
        </header>

        <p v-if="identityWarning" class="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
            {{ identityWarning }}
        </p>
        <p v-if="successMessage" class="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
            {{ successMessage }}
        </p>
        <p v-if="loadError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {{ loadError }}
        </p>

        <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-[#253b73]">Próximos encontros</h2>
            <button type="button"
                class="text-sm font-semibold text-[#536bad] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:opacity-50"
                :disabled="loading" @click="loadAgenda">
                {{ loading ? 'Atualizando...' : 'Atualizar' }}
            </button>
        </div>

        <div v-if="loading" class="rounded-xl border border-[#e8ebf0] bg-white p-8 text-center text-sm text-[#6f7a8d]"
            role="status">
            Carregando encontros...
        </div>

        <div v-else-if="agendaItems.length === 0"
            class="rounded-xl border border-dashed border-[#d6dce7] bg-white p-8 text-center">
            <h3 class="font-semibold text-[#253b73]">Nenhum encontro na Agenda</h3>
            <p class="mt-2 text-sm text-[#6f7a8d]">Crie o primeiro encontro da comunidade.</p>
        </div>

        <div v-else class="space-y-3">
            <article v-for="item in agendaItems" :key="item.id"
                class="rounded-xl border border-[#e8ebf0] bg-white p-4 shadow-sm sm:p-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                        <div class="mb-2 flex flex-wrap items-center gap-2">
                            <span class="rounded-md bg-[#e3e9fa] px-2 py-1 text-xs font-semibold text-[#253b73]">
                                {{ item.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
                            </span>
                            <span class="rounded-md bg-[#fff0eb] px-2 py-1 text-xs font-semibold text-[#b94d39]">
                                {{ item.format === 'online' ? 'Online' : 'Presencial' }}
                            </span>
                        </div>
                        <h3 class="break-words font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#253b73]">
                            {{ item.title }}
                        </h3>
                        <p class="mt-1 text-sm text-[#6f7a8d]">
                            {{ formatDateTime(item.startsAt) }} – {{ formatDateTime(item.endsAt) }}
                        </p>
                        <p v-if="isOrganizer(item)" class="mt-1 text-xs font-medium text-[#8b94a6]">
                            Organizado por você
                        </p>
                    </div>

                    <div class="flex shrink-0 flex-wrap gap-2">
                        <button type="button"
                            class="rounded-lg border border-[#dfe4ed] px-3 py-2 text-sm font-semibold text-[#536bad] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                            @click="openDetails(item)">
                            Detalhes
                        </button>
                        <button v-if="isOrganizer(item)" type="button"
                            class="rounded-lg border border-[#dfe4ed] px-3 py-2 text-sm font-semibold text-[#536bad] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                            @click="beginEdit(item)">
                            Editar
                        </button>
                        <button v-if="isOrganizer(item)" type="button"
                            class="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                            :disabled="cancellingAgendaId === item.id" @click="cancelItem(item)">
                            {{ cancellingAgendaId === item.id ? 'Cancelando...' : 'Cancelar' }}
                        </button>
                    </div>
                </div>
            </article>
        </div>

        <div v-if="formOpen"
            class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#101827]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
            @click.self="closeForm">
            <section role="dialog" aria-modal="true" aria-labelledby="agenda-form-title"
                class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-xl bg-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]">
                <header class="flex items-center justify-between gap-4 border-b border-[#e8ebf0] px-5 py-4 sm:px-7">
                    <h2 id="agenda-form-title"
                        class="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#253b73]">
                        {{ isEditing ? 'Editar encontro' : 'Criar encontro' }}
                    </h2>
                    <button type="button"
                        class="rounded-lg px-3 py-2 text-sm font-semibold text-[#53617a] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                        :disabled="formSaving" @click="closeForm">
                        Fechar
                    </button>
                </header>

                <form class="space-y-4 px-5 py-5 sm:px-7" @submit.prevent="saveAgendaItem">
                    <label for="agenda-title" class="block text-sm font-semibold text-[#374151]">
                        Título <span aria-hidden="true" class="text-red-600">*</span>
                    </label>
                    <input id="agenda-title" v-model="form.title" required maxlength="150"
                        class="-mt-3 h-11 w-full rounded-lg border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />

                    <label for="agenda-description" class="block text-sm font-semibold text-[#374151]">
                        Descrição <span aria-hidden="true" class="text-red-600">*</span>
                    </label>
                    <textarea id="agenda-description" v-model="form.description" required maxlength="5000" rows="4"
                        class="-mt-3 w-full rounded-lg border border-[#dfe4ed] px-3 py-2 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />

                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block text-sm font-semibold text-[#374151]" for="agenda-kind">
                            Tipo
                            <select id="agenda-kind" v-model="form.kind"
                                class="mt-2 h-11 w-full rounded-lg border border-[#dfe4ed] bg-white px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15">
                                <option value="event">Evento</option>
                                <option value="conversation">Roda de conversa</option>
                            </select>
                        </label>

                        <label class="block text-sm font-semibold text-[#374151]" for="agenda-format">
                            Modalidade
                            <select id="agenda-format" v-model="form.format"
                                class="mt-2 h-11 w-full rounded-lg border border-[#dfe4ed] bg-white px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15">
                                <option value="online">Online</option>
                                <option value="in_person">Presencial</option>
                            </select>
                        </label>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block text-sm font-semibold text-[#374151]" for="agenda-starts-at">
                            Início
                            <input id="agenda-starts-at" v-model="form.startsAt" type="datetime-local" required
                                class="mt-2 h-11 w-full min-w-0 rounded-lg border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />
                        </label>
                        <label class="block text-sm font-semibold text-[#374151]" for="agenda-ends-at">
                            Término
                            <input id="agenda-ends-at" v-model="form.endsAt" type="datetime-local" required
                                class="mt-2 h-11 w-full min-w-0 rounded-lg border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />
                        </label>
                    </div>

                    <label v-if="form.format === 'online'" class="block text-sm font-semibold text-[#374151]"
                        for="agenda-meeting-url">
                        URL da reunião <span class="font-normal text-[#8b94a6]">(opcional)</span>
                        <input id="agenda-meeting-url" v-model="form.meetingUrl" type="url" maxlength="2048"
                            class="mt-2 h-11 w-full rounded-lg border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />
                    </label>
                    <label v-else class="block text-sm font-semibold text-[#374151]" for="agenda-location">
                        Localização <span aria-hidden="true" class="text-red-600">*</span>
                        <input id="agenda-location" v-model="form.location" required maxlength="250"
                            class="mt-2 h-11 w-full rounded-lg border border-[#dfe4ed] px-3 text-sm outline-none focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15" />
                    </label>

                    <p v-if="formError" role="alert" class="text-sm text-red-700">{{ formError }}</p>

                    <footer class="flex flex-wrap justify-end gap-2 border-t border-[#edf0f4] pt-4">
                        <button type="button"
                            class="rounded-lg border border-[#dfe4ed] px-4 py-2.5 text-sm font-semibold text-[#53617a] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                            :disabled="formSaving" @click="closeForm">
                            Cancelar
                        </button>
                        <button type="submit"
                            class="rounded-lg bg-[#253b73] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d2f61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:opacity-50"
                            :disabled="formSaving">
                            {{ formSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar encontro' }}
                        </button>
                    </footer>
                </form>
            </section>
        </div>

        <div v-if="selectedAgenda"
            class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#101827]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
            @click.self="closeDetails">
            <section role="dialog" aria-modal="true" aria-labelledby="agenda-details-title"
                class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-xl bg-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]">
                <header class="flex items-start justify-between gap-4 border-b border-[#e8ebf0] px-5 py-4 sm:px-7">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wide text-[#e8755f]">
                            {{ selectedAgenda.kind === 'event' ? 'Evento' : 'Roda de conversa' }}
                            · {{ selectedAgenda.format === 'online' ? 'Online' : 'Presencial' }}
                        </p>
                        <h2 id="agenda-details-title"
                            class="mt-1 font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#253b73]">
                            {{ selectedAgenda.title }}
                        </h2>
                    </div>
                    <button type="button"
                        class="rounded-lg px-3 py-2 text-sm font-semibold text-[#53617a] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                        aria-label="Fechar detalhes" @click="closeDetails">
                        Fechar
                    </button>
                </header>

                <div class="space-y-5 px-5 py-5 sm:px-7">
                    <p class="text-sm text-[#53617a]">
                        {{ formatDateTime(selectedAgenda.startsAt) }} –
                        {{ formatDateTime(selectedAgenda.endsAt) }}
                    </p>
                    <p class="whitespace-pre-wrap break-words text-sm leading-7 text-[#374151]">
                        {{ selectedAgenda.description }}
                    </p>
                    <a v-if="selectedAgenda.format === 'online' && selectedAgenda.meetingUrl"
                        :href="selectedAgenda.meetingUrl" target="_blank" rel="noopener noreferrer"
                        class="inline-block break-all text-sm font-semibold text-[#536bad] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]">
                        Abrir link da reunião
                    </a>
                    <p v-if="selectedAgenda.format === 'in_person' && selectedAgenda.location"
                        class="text-sm text-[#53617a]">
                        Local: {{ selectedAgenda.location }}
                    </p>
                    <p v-if="detailsLoading" role="status" class="text-sm text-[#6f7a8d]">
                        Carregando participação...
                    </p>
                    <p v-if="detailError" role="alert" class="text-sm text-red-700">
                        {{ detailError }}
                    </p>

                    <div v-if="participation" class="grid gap-4 border-t border-[#edf0f4] pt-5 sm:grid-cols-2">
                        <section class="rounded-lg bg-[#f8f9fc] p-4">
                            <h3 class="font-semibold text-[#253b73]">Interesse</h3>
                            <p class="mt-1 text-sm text-[#6f7a8d]">
                                {{
                                    participation.interested
                                        ? 'Você tem interesse.'
                                        : 'Você ainda não marcou interesse.'
                                }}
                            </p>
                            <button type="button"
                                class="mt-3 rounded-lg border border-[#dfe4ed] bg-white px-3 py-2 text-sm font-semibold text-[#536bad] hover:bg-[#eef1f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:opacity-50"
                                :disabled="interestSaving || attendanceSaving || detailsLoading"
                                @click="setInterest(!participation.interested)">
                                {{
                                    interestSaving
                                        ? 'Atualizando...'
                                        : participation.interested
                                            ? 'Remover interesse'
                                            : 'Tenho interesse'
                                }}
                            </button>
                        </section>
                        <section class="rounded-lg bg-[#f8f9fc] p-4">
                            <h3 class="font-semibold text-[#253b73]">Presença</h3>
                            <p class="mt-1 text-sm text-[#6f7a8d]">
                                {{
                                    participation.confirmed
                                        ? 'Sua presença está confirmada.'
                                        : 'Sua presença não está confirmada.'
                                }}
                            </p>
                            <button type="button"
                                class="mt-3 rounded-lg border border-[#dfe4ed] bg-white px-3 py-2 text-sm font-semibold text-[#536bad] hover:bg-[#eef1f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:opacity-50"
                                :disabled="attendanceSaving || interestSaving || detailsLoading"
                                @click="setAttendance(!participation.confirmed)">
                                {{
                                    attendanceSaving
                                        ? 'Atualizando...'
                                        : participation.confirmed
                                            ? 'Retirar confirmação'
                                            : 'Confirmar presença'
                                }}
                            </button>
                        </section>
                    </div>


                    <footer v-if="isOrganizer(selectedAgenda)"
                        class="flex flex-wrap justify-end gap-2 border-t border-[#edf0f4] pt-4">
                        <button type="button"
                            class="rounded-lg border border-[#dfe4ed] px-4 py-2 text-sm font-semibold text-[#536bad] hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad]"
                            @click="beginEdit(selectedAgenda)">
                            Editar encontro
                        </button>
                        <button type="button"
                            class="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                            :disabled="cancellingAgendaId === selectedAgenda.id" @click="cancelItem(selectedAgenda)">
                            {{ cancellingAgendaId === selectedAgenda.id ? 'Cancelando...' : 'Cancelar encontro' }}
                        </button>
                    </footer>
                </div>
            </section>
        </div>


        <!-- Modal de confirmação de cancelamento -->
        <div v-if="agendaToCancel"
            class="fixed inset-0 z-[70] flex items-center justify-center bg-[#101827]/55 p-4 backdrop-blur-sm"
            @click.self="closeCancelModal">
            <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-agenda-title"
                aria-describedby="cancel-agenda-description"
                class="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_90px_rgba(22,31,55,0.22)]">


                <div class="mb-4 grid size-12 place-items-center rounded-xl bg-[#fff0eb] text-[#e8755f]">
                    <font-awesome-icon :icon="faExclamationCircle" size="lg" />
                </div>

                <h2 id="cancel-agenda-title" class="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#253b73]">
                    Cancelar encontro?
                </h2>

                <p id="cancel-agenda-description" class="mt-3 break-words text-sm leading-6 text-[#6f7a8d]">
                    Tem certeza de que deseja cancelar
                    <strong class="text-[#253b73]">{{ agendaToCancel.title }}</strong>?
                    Essa ação não poderá ser desfeita por esta tela.
                </p>

                <footer class="mt-6 flex flex-wrap justify-end gap-3">
                    <button type="button"
                        class="rounded-lg border border-[#dfe4ed] px-4 py-2.5 text-sm font-semibold text-[#53617a] transition hover:bg-[#f6f8fc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#536bad] disabled:opacity-50"
                        :disabled="cancellingAgendaId !== null" @click="closeCancelModal">
                        Voltar
                    </button>

                    <button type="button"
                        class="rounded-lg bg-[#e8755f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d9624c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8755f] disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="cancellingAgendaId !== null" @click="confirmCancelAgenda">
                        {{ cancellingAgendaId === agendaToCancel.id ? 'Cancelando...' : 'Sim, cancelar' }}
                    </button>
                </footer>
            </section>
        </div>

    </section>
</template>
