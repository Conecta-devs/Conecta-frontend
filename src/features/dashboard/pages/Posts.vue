<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createPost,
  deletePost,
  listPosts,
  updatePost,
  type Post,
} from '../services/posts'
import { getUserProfile } from '../../auth/services/auth'
import { currentUser, saveSession } from '../../../shared/services/session'

interface PostComment {
  id: string
  author: string
  text: string
}

interface PostInteraction {
  liked: boolean
  likeCount: number
  comments: PostComment[]
}

const posts = ref<Post[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const title = ref('')
const content = ref('')
const editingPostId = ref<string | null>(null)

// O backend de /posts não expõe curtidas nem comentários. Enquanto não há
// endpoints, estas interações vivem apenas no cliente desta tela.
const interactions = ref<Record<string, PostInteraction>>({})
const openCommentsId = ref<string | null>(null)
const commentDraft = ref('')

const isEditing = computed(() => editingPostId.value !== null)

function isMyPost(post: Post): boolean {
  return Boolean(currentUser.user?.sub) &&
    post.authorId === currentUser.user?.sub
}

function syncInteractions(loadedPosts: Post[]) {
  const next: Record<string, PostInteraction> = {}

  for (const post of loadedPosts) {
    next[post.id] = interactions.value[post.id] ?? {
      liked: false,
      likeCount: 0,
      comments: [],
    }
  }

  interactions.value = next
}

function ensureInteraction(postId: string): PostInteraction {
  if (!interactions.value[postId]) {
    interactions.value[postId] = {
      liked: false,
      likeCount: 0,
      comments: [],
    }
  }

  return interactions.value[postId]
}

function toggleLike(post: Post) {
  const interaction = ensureInteraction(post.id)
  interaction.liked = !interaction.liked
  interaction.likeCount = Math.max(
    0,
    interaction.likeCount + (interaction.liked ? 1 : -1),
  )
}

function toggleComments(postId: string) {
  openCommentsId.value = openCommentsId.value === postId ? null : postId
  commentDraft.value = ''
}

function addComment(post: Post) {
  const text = commentDraft.value.trim()
  if (!text) return

  ensureInteraction(post.id).comments.push({
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    author: currentUser.user?.name?.trim() || 'Você',
    text,
  })
  commentDraft.value = ''
}

async function loadPosts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const hydrateIdentity = (async () => {
      if (currentUser.user?.sub) return

      const profile = await getUserProfile()
      const user = currentUser.user

      if (!profile.sub || !user) {
        throw new Error('Não foi possível confirmar o usuário autenticado.')
      }

      saveSession({ ...user, sub: profile.sub })
    })()

    const [loadedPosts] = await Promise.all([listPosts(), hydrateIdentity])
    posts.value = loadedPosts
    syncInteractions(loadedPosts)
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

    delete interactions.value[post.id]
    if (openCommentsId.value === post.id) {
      toggleComments(post.id)
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
  <section
    class="flex w-full flex-col gap-6 bg-co-white px-page-gutter py-8"
    aria-labelledby="publicacoes-titulo"
  >
    <header class="flex flex-col gap-2.5">
      <p class="text-h6 font-medium text-co-blue">
        CONECTA · PUBLICAÇÕES
      </p>

      <h1 id="publicacoes-titulo" class="text-title font-semibold text-co-blue">
        Feed estudantil
      </h1>

      <p class="text-h5 font-medium text-text-2">
        Compartilhe ideias, tire dúvidas e descubra o que outros estudantes
        estão fazendo.
      </p>
    </header>

    <div
      v-if="errorMessage"
      role="alert"
      class="rounded-card border border-danger bg-danger/10 px-5 py-4 text-h6 text-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      role="status"
      class="rounded-card border border-feedback-success bg-feedback-success/10 px-5 py-4 text-h6 text-feedback-success"
    >
      {{ successMessage }}
    </div>

    <form
      class="flex flex-col gap-5 rounded-card border border-traceline bg-co-white p-6"
      @submit.prevent="submitPost"
    >
      <h2 class="text-h3 font-semibold text-co-blue">
        {{ isEditing ? 'Editar publicação' : 'Compartilhe com a comunidade' }}
      </h2>

      <div class="flex flex-col gap-2.5">
        <label for="post-title" class="text-h6 font-medium text-text-1">
          Título
        </label>

        <input
          id="post-title"
          v-model="title"
          type="text"
          maxlength="150"
          required
          placeholder="Sobre o que você quer conversar?"
          class="h-14 w-full rounded-button border border-traceline bg-co-white px-5 text-h5 font-medium text-text-1 outline-none transition-colors placeholder:text-text-2 focus:border-co-blue"
        />
      </div>

      <div class="flex flex-col gap-2.5">
        <label for="post-content" class="text-h6 font-medium text-text-1">
          Conteúdo <span class="text-text-2">(opcional)</span>
        </label>

        <textarea
          id="post-content"
          v-model="content"
          maxlength="5000"
          rows="4"
          placeholder="Conte mais detalhes, compartilhe uma dúvida ou apresente seu projeto..."
          class="h-30 w-full resize-none rounded-button border border-traceline bg-co-white px-5 pt-4 text-h5 font-medium text-text-1 outline-none transition-colors placeholder:text-text-2 focus:border-co-blue"
        />
      </div>

      <div class="flex items-center justify-between gap-4">
        <span class="text-h6 font-medium text-text-2">
          {{ content.length }}/5000 caracteres
        </span>

        <div class="flex items-center gap-2">
          <button
            v-if="isEditing"
            type="button"
            class="rounded-button px-4 py-3 text-h6 font-medium text-text-2 transition-colors hover:bg-s-blue/30"
            :disabled="saving"
            @click="resetForm"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="saving"
            class="h-[50px] w-[150px] rounded-button bg-co-blue px-5 text-h5 font-medium text-co-white transition-colors hover:bg-co-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
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

    <section class="flex flex-col gap-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-h2 font-semibold text-co-blue">
          Publicações
        </h2>

        <button
          type="button"
          class="text-h4 font-medium text-co-blue transition-opacity hover:underline disabled:opacity-60"
          :disabled="loading"
          @click="loadPosts"
        >
          Atualizar feed
        </button>
      </div>

      <div
        v-if="loading"
        class="rounded-card border border-traceline bg-co-white p-6 text-center text-h5 font-medium text-text-2"
      >
        Carregando publicações...
      </div>

      <div
        v-else-if="posts.length === 0"
        class="rounded-card border border-dashed border-traceline bg-co-white p-6 text-center"
      >
        <h3 class="text-h3 font-semibold text-co-blue">
          O feed ainda está vazio
        </h3>
        <p class="mt-2 text-h5 font-medium text-text-2">
          Seja o primeiro a compartilhar algo com a comunidade!
        </p>
      </div>

      <div v-else class="flex flex-col gap-5">
        <article
          v-for="post in posts"
          :key="post.id"
          class="rounded-card border border-traceline bg-co-white p-6"
        >
          <div class="flex items-center gap-3.5">
            <div
              class="grid size-11 shrink-0 place-items-center rounded-full bg-traceline text-h6 font-medium text-co-blue"
              aria-hidden="true"
            >
              ES
            </div>

            <div class="flex flex-col gap-1">
              <p class="text-h6 font-medium text-co-blue">
                Estudante
              </p>
              <p class="text-h6 font-medium text-text-2">
                Comunidade Conecta
              </p>
            </div>
          </div>

          <h3 class="mt-4 break-words text-h3 font-semibold text-co-blue">
            {{ post.title }}
          </h3>

          <p
            v-if="post.content"
            class="mt-4 whitespace-pre-wrap break-words text-h5 font-medium text-text-2"
          >
            {{ post.content }}
          </p>

          <div
            class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-traceline pt-4"
          >
            <div class="flex items-center gap-5">
              <button
                type="button"
                class="text-h6 font-medium transition-colors hover:underline"
                :class="interactions[post.id]?.liked ? 'text-co-coral' : 'text-co-blue'"
                :aria-pressed="interactions[post.id]?.liked ?? false"
                @click="toggleLike(post)"
              >
                {{ interactions[post.id]?.liked ? 'Curtido' : 'Curtir' }}
                ({{ interactions[post.id]?.likeCount ?? 0 }})
              </button>

              <button
                type="button"
                class="text-h6 font-medium text-co-blue transition-colors hover:underline"
                :aria-expanded="openCommentsId === post.id"
                @click="toggleComments(post.id)"
              >
                Comentar ({{ interactions[post.id]?.comments.length ?? 0 }})
              </button>
            </div>

            <div v-if="isMyPost(post)" class="flex items-center gap-2">
              <button
                type="button"
                class="text-h6 font-medium text-co-blue transition-colors hover:underline"
                @click="startEditing(post)"
              >
                Editar
              </button>

              <button
                type="button"
                class="text-h6 font-medium text-co-coral transition-colors hover:underline"
                @click="removePost(post)"
              >
                Excluir
              </button>
            </div>
          </div>

          <div
            v-if="openCommentsId === post.id"
            class="mt-4 flex flex-col gap-3 border-t border-traceline pt-4"
          >
            <p
              v-for="comment in interactions[post.id]?.comments ?? []"
              :key="comment.id"
              class="text-h6 text-text-1"
            >
              <span class="font-medium text-co-blue">{{ comment.author }}:</span>
              {{ comment.text }}
            </p>

            <form
              class="flex items-center gap-2"
              @submit.prevent="addComment(post)"
            >
              <input
                v-model="commentDraft"
                type="text"
                maxlength="500"
                aria-label="Escrever comentário"
                placeholder="Escreva um comentário..."
                class="h-11 w-full rounded-button border border-traceline bg-co-white px-4 text-h6 font-medium text-text-1 outline-none transition-colors placeholder:text-text-2 focus:border-co-blue"
              />

              <button
                type="submit"
                :disabled="!commentDraft.trim()"
                class="h-11 shrink-0 rounded-button bg-co-blue px-5 text-h6 font-medium text-co-white transition-colors hover:bg-co-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enviar
              </button>
            </form>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
