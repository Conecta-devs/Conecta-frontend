<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
    faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons'
import {
    cancelAgendaItem,
    createAgendaItem,
    listAgendaItems,
    updateAgendaItem,
    type AgendaFormat,
    type AgendaItem,
    type AgendaItemInput,
    type AgendaKind,
} from '@/features/dashboard/services/agenda'
import AgendaDetailsButton from '@/features/dashboard/components/AgendaDetailsButton.vue'
import AgendaDetailsModal from '@/features/dashboard/components/AgendaDetailsModal.vue'
import AppModal from '@/features/dashboard/components/AppModal.vue'
import ConfirmDialog from '@/features/dashboard/components/ConfirmDialog.vue'
import PageHeader from '@/features/dashboard/components/PageHeader.vue'
import AsyncState from '@/features/dashboard/components/AsyncState.vue'
import calendarEvent from '@/features/dashboard/assets/agenda/calendar-event.svg'
import { getUserProfile } from '@/features/auth/services/auth'
import { currentUser, saveSession } from '@/shared/services/session'
import { AppButton } from '@/shared/ui'
import { formatDateTime, isOrganizer } from '@/features/dashboard/utils/format'

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
const formOpen = ref(false)
const formSaving = ref(false)
const editingAgendaId = ref<string | null>(null)
const form = ref<AgendaForm>(emptyForm())
const detailsOpen = ref(false)
const detailsItems = ref<AgendaItem[]>([])
const cancellingAgendaId = ref<string | null>(null)
const agendaToCancel = ref<AgendaItem | null>(null)

const isEditing = computed(() => editingAgendaId.value !== null)

function kindLabel(item: AgendaItem): string {
    return item.kind === 'conversation' ? 'Roda de conversa' : 'Evento'
}

function formatLabel(item: AgendaItem): string {
    return item.format === 'in_person' ? 'Presencial' : 'Online'
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
        const [items] = await Promise.all([listAgendaItems(), hydrateOrganizerIdentity()])
        agendaItems.value = items
            .filter((item) => item.cancelledAt === null)
            .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Não foi possível carregar a Agenda.'
    } finally {
        loading.value = false
    }
}

function openDetails(item: AgendaItem) {
    detailsItems.value = [item]
    detailsOpen.value = true
}

function closeDetails() {
    detailsOpen.value = false
    detailsItems.value = []
}

function beginCreate() {
    form.value = emptyForm()
    editingAgendaId.value = null
    formError.value = ''
    successMessage.value = ''
    formOpen.value = true
}

function beginEdit(item: AgendaItem) {
    if (!isOrganizer(item, currentUser.user?.sub)) return

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
    const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    if (!dateTimePattern.test(form.value.startsAt) || !dateTimePattern.test(form.value.endsAt)) {
        throw new Error('Informe um ano com quatro dígitos.')
    }

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

function cancelItem(item: AgendaItem) {
    if (!isOrganizer(item, currentUser.user?.sub) || cancellingAgendaId.value) return

    agendaToCancel.value = item
}

function closeCancelModal() {
    if (cancellingAgendaId.value) return

    agendaToCancel.value = null
}

async function confirmCancelAgenda() {
    const item = agendaToCancel.value

    if (!item || !isOrganizer(item, currentUser.user?.sub) || cancellingAgendaId.value) return

    cancellingAgendaId.value = item.id
    loadError.value = ''
    successMessage.value = ''

    try {
        const cancelled = await cancelAgendaItem(item.id)

        agendaItems.value = agendaItems.value.filter(
            (entry) => entry.id !== cancelled.id,
        )

        successMessage.value = 'Encontro cancelado com sucesso.'

        if (detailsItems.value.some((entry) => entry.id === item.id)) {
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
    <!-- Figma: Agenda Conecta > Encontros (873:609). Boas-vindas e Busca e perfil
         são renderizados pelo AppHeader do layout, conforme decidido na coordenação. -->
    <section
        class="flex w-full min-w-0 flex-col gap-6 bg-co-white px-page-gutter py-8"
        aria-labelledby="agenda-titulo"
    >
        <PageHeader
            eyebrow="AGENDA"
            title="Agenda"
            description="Encontros, eventos e conversas da comunidade estudantil."
            id="agenda-titulo"
        >
            <template #actions>
                <AppButton variant="blue" :width="210" centered :arrow="false"
                    @click="beginCreate">
                    Criar encontro
                </AppButton>
            </template>
        </PageHeader>

        <p v-if="identityWarning"
            class="rounded-card border border-traceline bg-s-coral px-4 py-3 text-h6 font-medium text-co-blue"
            role="status">
            {{ identityWarning }}
        </p>
        <p v-if="successMessage"
            class="rounded-card border border-feedback-success bg-feedback-success/10 px-4 py-3 text-h6 font-medium text-feedback-success"
            role="status">
            {{ successMessage }}
        </p>
        <p v-if="loadError" role="alert"
            class="rounded-card border border-danger bg-danger/10 px-4 py-3 text-h6 font-medium text-danger">
            {{ loadError }}
        </p>

        <div class="flex items-center justify-between gap-3">
            <h2 class="text-h3 font-semibold text-co-blue">Próximos encontros</h2>
            <button type="button"
                class="text-h4 font-medium text-co-blue transition-colors hover:text-co-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
                :disabled="loading" @click="loadAgenda">
                {{ loading ? 'Atualizando...' : 'Atualizar' }}
            </button>
        </div>

        <AsyncState
            v-if="loading"
            kind="loading"
            message="Carregando encontros..."
            class="rounded-card border border-traceline bg-co-white p-8 text-center text-h6 font-medium"
        />

        <div v-else-if="agendaItems.length === 0"
            class="rounded-card border border-dashed border-traceline bg-co-white p-8 text-center">
            <h3 class="text-h3 font-semibold text-co-blue">Nenhum encontro na Agenda</h3>
            <p class="mt-2 text-h6 font-medium text-text-2">Crie o primeiro encontro da comunidade.</p>
        </div>

        <div v-else class="flex flex-col gap-4">
            <article v-for="item in agendaItems" :key="item.id"
                class="flex w-full flex-wrap items-center justify-between gap-6 rounded-card border border-traceline bg-white p-6 max-[620px]:p-5">
                <div class="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="rounded-md bg-traceline px-2.5 py-1.5 text-h6 font-medium text-co-blue">
                            {{ kindLabel(item) }}
                        </span>
                        <span class="rounded-md bg-s-coral px-2.5 py-1.5 text-h6 font-medium text-co-blue">
                            {{ formatLabel(item) }}
                        </span>
                    </div>

                    <h3 class="break-words text-h3 font-semibold text-co-blue">
                        {{ item.title }}
                    </h3>

                    <div class="flex items-center gap-2.5">
                        <span class="relative block h-[15.804px] w-[14.222px] shrink-0 overflow-hidden">
                            <img :src="calendarEvent" alt=""
                                class="absolute inset-0 block h-full w-full max-w-none" />
                        </span>
                        <p class="text-h6 font-medium text-text-2">
                            {{ formatDateTime(item.startsAt) }} – {{ formatDateTime(item.endsAt) }}
                        </p>
                    </div>

                    <p class="text-h6 font-medium text-text-2">
                        <template v-if="isOrganizer(item, currentUser.user?.sub)">
                            Organizado por você
                        </template>
                        <template v-else-if="item.organizer?.name">
                            Organizado por {{ item.organizer.name }}
                        </template>
                        <template v-else>
                            Organizado por um estudante
                        </template>
                    </p>
                </div>

                <div class="flex shrink-0 flex-wrap items-center gap-2.5">
                    <AgendaDetailsButton @click="openDetails(item)" />
                    <button v-if="isOrganizer(item, currentUser.user?.sub)" type="button"
                        class="h-[50px] w-[150px] rounded-button border border-co-blue bg-co-white text-h5 font-medium text-co-blue transition-colors hover:bg-s-blue/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
                        @click="beginEdit(item)">
                        Editar
                    </button>
                    <button v-if="isOrganizer(item, currentUser.user?.sub)" type="button"
                        class="h-[50px] w-[150px] rounded-button border border-co-coral bg-co-white text-h5 font-medium text-co-coral transition-colors hover:bg-s-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-coral disabled:opacity-50"
                        :disabled="cancellingAgendaId === item.id" @click="cancelItem(item)">
                        {{ cancellingAgendaId === item.id ? 'Cancelando...' : 'Cancelar' }}
                    </button>
                </div>
            </article>
        </div>

        <AppModal
            v-if="formOpen"
            :title="isEditing ? 'Editar encontro' : 'Criar encontro'"
            labelled-by="agenda-form-title"
            max-width="2xl"
            @backdrop="closeForm"
        >
            <template #header-actions>
                <button type="button"
                    class="rounded-button px-3 py-2 text-h6 font-medium text-text-2 transition-colors hover:bg-s-blue/30 hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
                    :disabled="formSaving" @click="closeForm">
                    Fechar
                </button>
            </template>

                <form class="flex flex-col gap-4 px-5 py-5 sm:px-7" @submit.prevent="saveAgendaItem">
                    <label for="agenda-title" class="block text-h6 font-medium text-text-1">
                        Título <span aria-hidden="true" class="text-co-coral">*</span>
                    </label>
                    <input id="agenda-title" v-model="form.title" required maxlength="150"
                        class="-mt-3 h-11 w-full rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />

                    <label for="agenda-description" class="block text-h6 font-medium text-text-1">
                        Descrição <span aria-hidden="true" class="text-co-coral">*</span>
                    </label>
                    <textarea id="agenda-description" v-model="form.description" required maxlength="5000" rows="4"
                        class="-mt-3 w-full rounded-button border border-traceline bg-white px-3 py-2 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />

                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block text-h6 font-medium text-text-1" for="agenda-kind">
                            Tipo
                            <select id="agenda-kind" v-model="form.kind"
                                class="mt-2 h-11 w-full rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30">
                                <option value="event">Evento</option>
                                <option value="conversation">Roda de conversa</option>
                            </select>
                        </label>

                        <label class="block text-h6 font-medium text-text-1" for="agenda-format">
                            Modalidade
                            <select id="agenda-format" v-model="form.format"
                                class="mt-2 h-11 w-full rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30">
                                <option value="online">Online</option>
                                <option value="in_person">Presencial</option>
                            </select>
                        </label>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block text-h6 font-medium text-text-1" for="agenda-starts-at">
                            Início
                            <input id="agenda-starts-at" v-model="form.startsAt" type="datetime-local" required
                                max="9999-12-31T23:59"
                                class="mt-2 h-11 w-full min-w-0 rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />
                        </label>
                        <label class="block text-h6 font-medium text-text-1" for="agenda-ends-at">
                            Término
                            <input id="agenda-ends-at" v-model="form.endsAt" type="datetime-local" required
                                max="9999-12-31T23:59"
                                class="mt-2 h-11 w-full min-w-0 rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />
                        </label>
                    </div>

                    <label v-if="form.format === 'online'" class="block text-h6 font-medium text-text-1"
                        for="agenda-meeting-url">
                        URL da reunião <span class="font-normal text-text-2">(opcional)</span>
                        <input id="agenda-meeting-url" v-model="form.meetingUrl" type="url" maxlength="2048"
                            class="mt-2 h-11 w-full rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />
                    </label>
                    <label v-else class="block text-h6 font-medium text-text-1" for="agenda-location">
                        Localização <span aria-hidden="true" class="text-co-coral">*</span>
                        <input id="agenda-location" v-model="form.location" required maxlength="250"
                            class="mt-2 h-11 w-full rounded-button border border-traceline bg-white px-3 text-h6 font-medium text-text-1 outline-none focus:border-s-blue focus:ring-2 focus:ring-s-blue/30" />
                    </label>

                    <p v-if="formError" role="alert" class="text-h6 font-medium text-co-coral">{{ formError }}</p>

                    <footer class="flex flex-wrap justify-end gap-2 border-t border-traceline pt-4">
                        <button type="button"
                            class="h-[50px] rounded-button border border-traceline bg-co-white px-4 text-h5 font-medium text-text-2 transition-colors hover:bg-s-blue/30 hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
                            :disabled="formSaving" @click="closeForm">
                            Cancelar
                        </button>
                        <button type="submit"
                            class="h-[50px] rounded-button bg-co-blue px-4 text-h5 font-medium text-co-white transition-colors hover:bg-co-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue disabled:opacity-50"
                            :disabled="formSaving">
                            {{ formSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar encontro' }}
                        </button>
                    </footer>
                </form>
        </AppModal>

        <AgendaDetailsModal
            v-if="detailsOpen"
            :items="detailsItems"
            show-organizer-actions
            @close="closeDetails"
            @edit="beginEdit"
            @cancel="cancelItem" />

        <ConfirmDialog
            v-if="agendaToCancel"
            title="Cancelar encontro?"
            cancel-label="Voltar"
            :confirm-label="cancellingAgendaId === agendaToCancel.id ? 'Cancelando...' : 'Sim, cancelar'"
            labelled-by="cancel-agenda-title"
            described-by="cancel-agenda-description"
            danger
            :busy="cancellingAgendaId !== null"
            @cancel="closeCancelModal"
            @confirm="confirmCancelAgenda"
        >
            <template #icon>
                <font-awesome-icon :icon="faExclamationCircle" size="lg" />
            </template>
            <template #description>
                Tem certeza de que deseja cancelar
                <strong class="text-co-blue">{{ agendaToCancel.title }}</strong>?
                Essa ação não poderá ser desfeita por esta tela.
            </template>
        </ConfirmDialog>
    </section>
</template>
