
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createPost,
  deletePost,
  listPosts,
  updatePost,
  type Post,
} from '../../services/posts'
import { getUserProfile } from '../../services/auth'
import { currentUser, saveSession } from '../../services/session'

const posts = ref<Post[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const title = ref('')
const content = ref('')
const editingPostId = ref<string | null>(null)

const isEditing = computed(() => editingPostId.value !== null)

function isMyPost(post: Post): boolean {
  return Boolean(currentUser.user?.sub) &&
    post.authorId === currentUser.user?.sub
}

async function loadPosts() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (!currentUser.user?.sub) {
      const profile = await getUserProfile()
      const user = currentUser.user

      if (!profile.sub || !user) {
        throw new Error('Não foi possível confirmar o usuário autenticado.')
      }

      saveSession({ ...user, sub: profile.sub })
    }

    posts.value = await listPosts()

    console.log('Usuário conectado:', currentUser.user)
    console.log('Publicações recebidas:', posts.value)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível carregar as publicações.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  title.value = ''
  content.value = ''
  editingPostId.value = null
}

function startEditing(post: Post) {
  title.value = post.title
  content.value = post.content ?? ''
  editingPostId.value = post.id
  errorMessage.value = ''
  successMessage.value = ''

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submitPost() {
  if (!title.value.trim()) {
    errorMessage.value = 'Informe um título para a publicação.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const input = {
      title: title.value.trim(),
      content: content.value.trim() || null,
    }

    if (editingPostId.value) {
      await updatePost(editingPostId.value, input)
      successMessage.value = 'Publicação atualizada com sucesso.'
    } else {
      await createPost(input)
      successMessage.value = 'Publicação criada com sucesso.'
    }

    resetForm()
    await loadPosts()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível salvar a publicação.'
  } finally {
    saving.value = false
  }
}

async function removePost(post: Post) {
  if (!isMyPost(post)) return

  const confirmed = window.confirm(
    `Deseja excluir a publicação "${post.title}"?`,
  )

  if (!confirmed) return

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await deletePost(post.id)

    if (editingPostId.value === post.id) {
      resetForm()
    }

    successMessage.value = 'Publicação excluída com sucesso.'
    await loadPosts()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Não foi possível excluir a publicação.'
  }
}

onMounted(loadPosts)
</script>

<template>
  <section class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="mb-8">
      <p class="mb-2 text-sm font-semibold text-[#e8755f]">
        CONECTA · COMUNIDADE
      </p>

      <h1 class="font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#253b73]">
        Feed estudantil
      </h1>

      <p class="mt-2 text-sm leading-6 text-[#6f7a8d]">
        Compartilhe ideias, tire dúvidas e descubra o que outros estudantes
        estão fazendo.
      </p>
    </header>

    <div
      v-if="errorMessage"
      role="alert"
      class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      role="status"
      class="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {{ successMessage }}
    </div>

    <form
      class="mb-8 rounded-2xl border border-[#e8ebf0] bg-white p-5 shadow-sm sm:p-6"
      @submit.prevent="submitPost"
    >
      <h2 class="mb-5 text-lg font-bold text-[#253b73]">
        {{ isEditing ? 'Editar publicação' : 'Compartilhe com a comunidade' }}
      </h2>

      <label for="post-title" class="mb-2 block text-sm font-semibold text-[#374151]">
        Título
      </label>

      <input
        id="post-title"
        v-model="title"
        type="text"
        maxlength="150"
        required
        placeholder="Sobre o que você quer conversar?"
        class="mb-5 w-full rounded-xl border border-[#dfe4ed] px-4 py-3 text-sm outline-none transition focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15"
      />

      <label for="post-content" class="mb-2 block text-sm font-semibold text-[#374151]">
        Conteúdo <span class="font-normal text-[#8b94a6]">(opcional)</span>
      </label>

      <textarea
        id="post-content"
        v-model="content"
        maxlength="5000"
        rows="4"
        placeholder="Conte mais detalhes, compartilhe uma dúvida ou apresente seu projeto..."
        class="mb-4 w-full resize-y rounded-xl border border-[#dfe4ed] px-4 py-3 text-sm outline-none transition focus:border-[#536bad] focus:ring-2 focus:ring-[#536bad]/15"
      />

      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-xs text-[#8b94a6]">
          {{ content.length }}/5000 caracteres
        </span>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="isEditing"
            type="button"
            class="rounded-xl border border-[#dfe4ed] px-4 py-2.5 text-sm font-semibold text-[#53617a] transition hover:bg-[#f8f7f4]"
            :disabled="saving"
            @click="resetForm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-[#253b73] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c2e5c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{
              saving
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Publicar'
            }}
          </button>
        </div>
      </div>
    </form>

    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-[#253b73]">
        Publicações
      </h2>

      <button
        type="button"
        class="text-sm font-semibold text-[#536bad] hover:underline"
        :disabled="loading"
        @click="loadPosts"
      >
        Atualizar feed
      </button>
    </div>

    <div
      v-if="loading"
      class="rounded-2xl border border-[#e8ebf0] bg-white p-8 text-center text-sm text-[#6f7a8d]"
    >
      Carregando publicações...
    </div>

    <div
      v-else-if="posts.length === 0"
      class="rounded-2xl border border-dashed border-[#d6dce7] bg-white p-8 text-center"
    >
      <h3 class="font-semibold text-[#253b73]">
        O feed ainda está vazio
      </h3>
      <p class="mt-2 text-sm text-[#6f7a8d]">
        Seja o primeiro a compartilhar algo com a comunidade!
      </p>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="post in posts"
        :key="post.id"
        class="rounded-2xl border border-[#e8ebf0] bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="grid size-10 shrink-0 place-items-center rounded-full bg-[#e3e9fa] font-bold text-[#253b73]"
            >
              {{ isMyPost(post) ? 'EU' : 'ES' }}
            </div>

            <div class="min-w-0">
              <p class="text-sm font-semibold text-[#253b73]">
                {{ isMyPost(post) ? 'Você' : 'Estudante' }}
              </p>
              <p class="text-xs text-[#8b94a6]">
                {{ isMyPost(post) ? 'Sua publicação' : 'Comunidade Conecta' }}
              </p>
            </div>
          </div>

          <div v-if="isMyPost(post)" class="flex shrink-0 gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-xs font-semibold text-[#536bad] hover:bg-[#eef1f9]"
              @click="startEditing(post)"
            >
              Editar
            </button>

            <button
              type="button"
              class="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              @click="removePost(post)"
            >
              Excluir
            </button>
          </div>
        </div>

        <h3 class="break-words text-lg font-bold text-[#253b73]">
          {{ post.title }}
        </h3>

        <p
          v-if="post.content"
          class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#4b5563]"
        >
          {{ post.content }}
        </p>
      </article>
    </div>
  </section>
</template>
