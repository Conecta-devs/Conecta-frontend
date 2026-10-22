<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  gen: string
  bio: string
}

const emptyForm = (): ProfileForm => ({
  name: '',
  image: '',
  gen: 'Não informar',
  bio: '',
})

const form = ref<ProfileForm>(emptyForm())
const isSaving = ref(false)

const imagePreview = computed(() => {
  return form.value.image || 'https://placehold.co/240x240/a9b7e5/667087?text=Sua+foto'
})

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await loadProfile()
      return
    }

    form.value = emptyForm()
  },
)

async function loadProfile() {
  try {
    const profile = await getUserProfile()

    form.value = {
      name: profile.name || '',
      image: profile.image || '',
      gen: profile.gen || 'Não informar',
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
      gen: form.value.gen,
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
      class="fixed inset-0 z-[60] flex items-center justify-center bg-text-1/55 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div
        class="min-h-[86dvh] w-full max-w-[70dvw] overflow-y-auto rounded-[15px] border border-none bg-co-white shadow-xl shadow-co-blue/20"
      >
        <div class="flex items-center justify-between border-b border-traceline px-6 py-5 sm:px-8">
          <div>
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[1.6px] text-co-coral">
              Perfil de usuário
            </p>
            <h2 class="type-h2 text-text-1">
              Personalize sua presença
            </h2>
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

        <div class="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[230px_1fr]">
          <aside class="rounded-[24px] bg-s-blue/30 p-5">
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
                  class="h-12 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-text-2">
                <span>Imagem de perfil</span>
                <input
                  v-model="form.image"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  class="h-12 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-text-2">
                <span>Gênero</span>
                <select
                  v-model="form.gen"
                  class="h-12 rounded-xl border border-traceline bg-co-white px-3.5 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
                >
                  <option>Não informar</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
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
                class="min-h-[160px] resize-none rounded-xl border border-traceline bg-co-white px-3.5 py-3 text-sm text-text-1 outline-none transition focus:border-s-blue focus:shadow-co-blue/10"
              />
            </label>

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
