<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: ProfileForm): void
}>()

interface ProfileForm {
  imageUrl: string
  gender: string
  course: string
  city: string
  interests: string
  bio: string
}

const form = ref<ProfileForm>({
  imageUrl: '',
  gender: 'Não informar',
  course: '',
  city: '',
  interests: '',
  bio: '',
})

const imagePreview = computed(() => {
  return form.value.imageUrl || 'https://placehold.co/240x240/edf2f7/53617a?text=Sua+foto'
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      form.value = {
        imageUrl: '',
        gender: 'Não informar',
        course: '',
        city: '',
        interests: '',
        bio: '',
      }
    }
  },
)

function close() {
  emit('update:modelValue', false)
}

function saveProfile() {
  emit('save', { ...form.value })
  close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-[#101827]/55 p-4 backdrop-blur-sm"
      @click.self="close"
    >
      <div
        class="min-h-[86dvh] w-full max-w-[70dvw] overflow-y-auto rounded-[15px] border border-none  bg-white shadow-[0_30px_90px_rgba(22,31,55,0.22)]"
      >
        <div class="flex items-center justify-between border-b border-[#edf1f7] px-6 py-5 sm:px-8">
          <div>
            <p class="mb-1 text-[10px] font-bold uppercase tracking-[1.6px] text-[#e8755f]">
              Perfil de usuário
            </p>
            <h2 class="font-['Space_Grotesk',sans-serif] text-2xl font-semibold text-[#172238]">
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

        <div class="grid gap-8 px-6 py-6 sm:px-8 lg:grid-cols-[230px_1fr]">
          <aside class="rounded-[24px] bg-[#f6f8fc] p-5">
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
              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Imagem de perfil</span>
                <input
                  v-model="form.imageUrl"
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  class="h-12 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Gênero</span>
                <select
                  v-model="form.gender"
                  class="h-12 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                >
                  <option>Não informar</option>
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                </select>
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Curso / área</span>
                <input
                  v-model="form.course"
                  type="text"
                  placeholder="Ex: Sistemas de informação"
                  class="h-12 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                />
              </label>

              <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
                <span>Cidade</span>
                <input
                  v-model="form.city"
                  type="text"
                  placeholder="Ex: São Paulo"
                  class="h-12 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
                />
              </label>
            </div>

            <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
              <span>Interesses</span>
              <input
                v-model="form.interests"
                type="text"
                placeholder="Ex: tecnologia, música, esportes, inovação"
                class="h-12 rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
              />
            </label>

            <label class="flex flex-col gap-2 text-xs font-bold text-[#53617a]">
              <span>Bio</span>
              <textarea
                v-model="form.bio"
                rows="7"
                maxlength="280"
                placeholder="Conte um pouco sobre você, suas metas, hobbies e o que você busca na comunidade..."
                class="min-h-[160px] resize-none rounded-xl border border-[#e1e5ec] bg-[#fbfcfe] px-3.5 py-3 text-sm text-[#172238] outline-none transition focus:border-[#536bad] focus:shadow-[0_0_0_3px_rgba(83,107,173,.08)]"
              />
            </label>

            <div class="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              
              <button
                type="submit"
                class="inline-flex h-12 items-center justify-center rounded-xl bg-[#253b73] px-6 text-sm font-bold text-white transition hover:bg-[#1d2f61]"
              >
                Salvar perfil
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
