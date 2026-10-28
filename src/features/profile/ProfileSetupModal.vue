<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { getUserProfile, updateUserProfile } from '../auth/services/auth'
import { currentUser, saveSession } from '../../shared/services/session'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: ProfileForm): void
}>()

interface ProfileForm {
  name: string
  image: string
  gen: GenderValue
  bio: string
}

type GenderValue = 'masculino' | 'feminino' | 'outro' | 'prefiro nao informar'

function normalizeGenderValue(value?: string | null): GenderValue {
  switch (value?.trim().toLocaleLowerCase('pt-BR')) {
    case 'masculino':
      return 'masculino'
    case 'feminino':
      return 'feminino'
    case 'outro':
      return 'outro'
    case 'prefiro nao informar':
    case 'prefiro não informar':
    case 'nao informar':
    case 'não informar':
    default:
      return 'prefiro nao informar'
  }
}

/** Diferencia "sem informação" de uma preferência realmente gravada. */
function temGeneroInformado(value?: string | null): boolean {
  const normalizado = value?.trim().toLocaleLowerCase('pt-BR')

  return Boolean(
    normalizado &&
    normalizado !== 'não informar' &&
    normalizado !== 'nao informar' &&
    normalizado !== 'prefiro não informar' &&
    normalizado !== 'prefiro nao informar',
  )
}

const emptyForm = (): ProfileForm => ({
  name: '',
  image: '',
  gen: 'prefiro nao informar',
  bio: '',
})

const form = ref<ProfileForm>(emptyForm())
const isSaving = ref(false)
const erroSalvar = ref('')
/** `GET /auth/profile` ainda devolve só sub/email/name (sem bio/gen/image). */
const genDisponivel = ref(false)
/** O usuário escolheu um gênero nesta sessão (deve ser enviado mesmo sem base). */
const genAlterado = ref(false)
let previousBodyOverflow: string | null = null
let previousDocumentOverflow: string | null = null

const imagePreview = computed(() => {
  return form.value.image || 'https://placehold.co/240x240/a9b7e5/667087?text=Sua+foto'
})

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow
      previousDocumentOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      erroSalvar.value = ''
      genAlterado.value = false
      await loadProfile()
      return
    }

    restoreBodyOverflow()
    form.value = emptyForm()
    erroSalvar.value = ''
    genDisponivel.value = false
    genAlterado.value = false
  },
)

function restoreBodyOverflow() {
  if (previousBodyOverflow === null || previousDocumentOverflow === null) return

  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousDocumentOverflow
  previousBodyOverflow = null
  previousDocumentOverflow = null
}

onBeforeUnmount(restoreBodyOverflow)

async function loadProfile() {
  try {
    const profile = await getUserProfile()
    genDisponivel.value =
      temGeneroInformado(profile.gen) || temGeneroInformado(currentUser.user?.gen)

    form.value = {
      name: profile.name || currentUser.user?.name || '',
      image: profile.image || currentUser.user?.image || '',
      gen: normalizeGenderValue(profile.gen?.trim() || currentUser.user?.gen),
      bio: profile.bio || currentUser.user?.bio || '',
    }
  } catch {
    // Sem resposta da API, mantém o que já está na sessão em vez de zerar tudo.
    const user = currentUser.user
    genDisponivel.value = temGeneroInformado(user?.gen)

    form.value = {
      name: user?.name ?? '',
      image: user?.image ?? '',
      gen: normalizeGenderValue(user?.gen),
      bio: user?.bio ?? '',
    }
  }
}

function close() {
  emit('update:modelValue', false)
}

async function saveProfile() {
  isSaving.value = true
  erroSalvar.value = ''

  // Só envia `gen` quando existe valor real (API/sessão) ou o usuário escolheu.
  // Caso contrário o default "prefiro nao informar" sobrescreveria o banco.
  const enviarGen = genDisponivel.value || genAlterado.value

  try {
    const updated = await updateUserProfile({
      name: form.value.name,
      bio: form.value.bio,
      image: form.value.image,
      ...(enviarGen ? { gen: normalizeGenderValue(form.value.gen) } : {}),
    })

    saveSession({
      name: updated.name || form.value.name,
      email: updated.email || currentUser.user?.email || '',
      bio: updated.bio || form.value.bio,
      image: updated.image || form.value.image,
      gen: updated.gen || currentUser.user?.gen || '',
    })

    emit('save', { ...form.value })
    close()
  } catch (error) {
    erroSalvar.value =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : 'Não foi possível salvar o perfil. Tente novamente.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-hidden bg-text-1/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl border border-traceline bg-co-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div
          class="flex items-center justify-between gap-3 border-b border-traceline px-4 py-4 sm:px-8 sm:py-5"
        >
          <div>
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[1.6px] text-co-coral">
              Perfil de usuário
            </p>
            <h2 id="profile-setup-title" class="text-h2 text-text-1">Personalize sua presença</h2>
          </div>
          <button
            type="button"
            class="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-traceline bg-co-white text-xl text-text-2 transition-colors hover:bg-s-blue/30"
            @click="close"
            aria-label="Fechar modal"
          >
            <font-awesome-icon :icon="faXmark" />
          </button>
        </div>

        <div
          class="grid min-w-0 gap-6 px-4 py-5 sm:gap-8 sm:px-8 sm:py-6 lg:grid-cols-[230px_minmax(0,1fr)]"
        >
          <aside class="min-w-0 rounded-2xl bg-s-blue/30 p-4 sm:p-5">
            <div
              class="mb-4 mx-auto flex h-[170px] w-[170px] items-center justify-center overflow-hidden rounded-full border-4 border-co-white bg-s-blue shadow-lg shadow-co-blue/10"
            >
              <img
                :src="imagePreview"
                alt="Preview da imagem de perfil"
                class="h-full w-full object-cover"
              />
            </div>

            <div class="space-y-2 text-center">
              <p class="text-[10px] font-bold uppercase tracking-[1.4px] text-text-2">
                Sua identidade
              </p>
              <p class="text-sm leading-6 text-text-2">
                Ajude a comunidade a conhecer melhor sua vibe, seus interesses e o que você busca.
              </p>
            </div>
          </aside>

          <form class="space-y-5" @submit.prevent="saveProfile">
            <div class="grid gap-5 md:grid-cols-2">
              <label class="flex flex-col gap-2 text-xs font-bold text-text-2 md:col-span-2">
                <span>Nome</span>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Seu nome completo"
                  class="h-12 w-full min-w-0 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-text-2">
                <span>Imagem de perfil</span>
                <input
                  v-model="form.image"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  class="h-12 w-full min-w-0 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-text-2">
                <span>Gênero</span>
                <select
                  v-model="form.gen"
                  class="h-12 w-full min-w-0 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                  @change="genAlterado = true"
                >
                  <option value="prefiro nao informar">Prefiro não informar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col gap-2 text-xs font-bold text-text-2">
              <span>Bio</span>
              <textarea
                v-model="form.bio"
                rows="7"
                maxlength="280"
                placeholder="Conte um pouco sobre você, suas metas, hobbies e o que você busca na comunidade..."
                class="min-h-[160px] w-full min-w-0 resize-y rounded-xl border border-traceline bg-co-white px-3.5 py-3 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
              />
            </label>

            <p
              v-if="erroSalvar"
              class="text-sm font-semibold text-[rgba(255,0,4,0.75)]"
              role="alert"
            >
              {{ erroSalvar }}
            </p>

            <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="submit"
                class="inline-flex h-12 items-center justify-center rounded-xl bg-co-blue px-6 text-sm font-bold text-co-white transition hover:bg-co-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Salvando...' : 'Salvar perfil' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
