<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { getUserProfile, updateUserProfile } from '../../services/auth'
import { currentUser, saveSession } from '../../services/session'

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

const emptyForm = (): ProfileForm => ({
  name: '',
  image: '',
  gen: 'prefiro nao informar',
  bio: '',
})

const form = ref<ProfileForm>(emptyForm())
const isSaving = ref(false)
let previousBodyOverflow: string | null = null
let previousDocumentOverflow: string | null = null

const imagePreview = computed(() => {
  return form.value.image || 'https://placehold.co/240x240/edf2f7/53617a?text=Sua+foto'
})

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow
      previousDocumentOverflow = document.documentElement.style.overflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      await loadProfile()
      return
    }

    restoreBodyOverflow()
    form.value = emptyForm()
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

    form.value = {
      name: profile.name || '',
      image: profile.image || '',
      gen: normalizeGenderValue(profile.gen),
      bio: profile.bio || '',
    }
  } catch {
    form.value = emptyForm()
  }
}

function close() {
  emit('update:modelValue', false)
}

async function saveProfile() {
  isSaving.value = true

  try {
    await updateUserProfile({
      name: form.value.name,
      bio: form.value.bio,
      gen: normalizeGenderValue(form.value.gen),
      image: form.value.image,
    })

    if (currentUser.user) {
      saveSession(
        {
          ...currentUser.user,
          name: form.value.name,
          bio: form.value.bio,
          gen: form.value.gen,
          image: form.value.image,
        },
      )
    } else {
      localStorage.setItem('userImage', form.value.image)
    }

    emit('save', { ...form.value })
    close()
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-hidden bg-[#101827]/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="close"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-setup-title"
        class="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl bg-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div class="flex items-center justify-between gap-3 border-b border-[#edf1f7] px-4 py-4 sm:px-8 sm:py-5">
          <div>
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[1.6px] text-[#e8755f]">
              Perfil de usuário
            </p>
            <h2
              id="profile-setup-title"
              class="font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#172238] sm:text-2xl"
            >
              Personalize sua presença
            </h2>
          </div>
          <button
            type="button"
            class="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-[#e0e6f1] bg-white text-xl text-[#53617a] transition-colors hover:bg-[#f2f5fa]"
            @click="close"
            aria-label="Fechar modal"
          >
            <font-awesome-icon :icon="faXmark" />
          </button>
        </div>

        <div class="grid min-w-0 gap-6 px-4 py-5 sm:gap-8 sm:px-8 sm:py-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside class="min-w-0 rounded-2xl bg-[#f6f8fc] p-4 sm:p-5">
            <div
              class="mb-4 mx-auto flex h-[170px] w-[170px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e8edf7] shadow-[0_10px_30px_rgba(37,59,115,0.12)]"
            >
              <img
                :src="imagePreview"
                alt="Preview da imagem de perfil"
                class="h-full w-full object-cover"
              />
            </div>

            <div class="space-y-2 text-center">
              <p class="text-[10px] font-bold uppercase tracking-[1.4px] text-[#8b94a6]">
                Sua identidade
              </p>
              <p class="text-sm leading-6 text-[#53617a]">
                Ajude a comunidade a conhecer melhor sua vibe, seus interesses e o que você busca.
              </p>
            </div>
          </aside>

          <form class="space-y-5" @submit.prevent="saveProfile">
            <div class="grid gap-5 md:grid-cols-2">
              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a] md:col-span-2">
                <span>Nome</span>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Seu nome completo"
                  class="h-12 w-full min-w-0 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Imagem de perfil</span>
                <input
                  v-model="form.image"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  class="h-12 w-full min-w-0 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Gênero</span>
                <select
                  v-model="form.gen"
                  class="h-12 w-full min-w-0 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                >
                  <option value="prefiro nao informar">Prefiro não informar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
            </div>

            <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
              <span>Bio</span>
              <textarea
                v-model="form.bio"
                rows="7"
                maxlength="280"
                placeholder="Conte um pouco sobre você, suas metas, hobbies e o que você busca na comunidade..."
                class="min-h-[160px] w-full min-w-0 resize-y rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 py-3 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
              />
            </label>

            <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              
              <button
                type="submit"
                class="inline-flex h-12 items-center justify-center rounded-xl bg-[#253b73] px-6 text-sm font-bold text-white transition hover:bg-[#1d2f61] disabled:cursor-not-allowed disabled:opacity-70"
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
