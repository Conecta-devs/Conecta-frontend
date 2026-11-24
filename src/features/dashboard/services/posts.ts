import { fetchProtected } from '../../auth/services/auth'
import { apiUrl } from './api'

const API_URL = apiUrl('/posts')

interface PostAuthor {
  id: string | null
  name: string | null
  image: string | null
}

export interface PostComment {
  id: string
  postId: string
  author: PostAuthor
  content: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string | null
  authorId: string
  author?: PostAuthor | null
  likeCount?: number
  likedByMe?: boolean
  comments?: PostComment[]
}

interface PostLikeResponse {
  liked: boolean
  likeCount: number
}

interface CreatePostInput {
  title: string
  content?: string | null
}

interface UpdatePostInput {
  title?: string
  content?: string | null
}

interface DeletePostResponse {
  message: string
  id: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPostAuthor(value: unknown): value is PostAuthor {
  return (
    isRecord(value) &&
    (typeof value.id === 'string' || value.id === null) &&
    (typeof value.name === 'string' || value.name === null) &&
    (typeof value.image === 'string' || value.image === null)
  )
}

function isPostComment(value: unknown): value is PostComment {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.postId === 'string' &&
    isPostAuthor(value.author) &&
    typeof value.content === 'string' &&
    typeof value.createdAt === 'string'
  )
}

function isPost(value: unknown): value is Post {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    (typeof value.content === 'string' || value.content === null) &&
    typeof value.authorId === 'string' &&
    (value.author === undefined ||
      value.author === null ||
      isPostAuthor(value.author)) &&
    (value.likeCount === undefined || typeof value.likeCount === 'number') &&
    (value.likedByMe === undefined || typeof value.likedByMe === 'boolean') &&
    (value.comments === undefined ||
      (Array.isArray(value.comments) && value.comments.every(isPostComment)))
  )
}

async function ensureSuccessfulResponse(response: Response): Promise<void> {
  if (response.ok) return

  const data: unknown = await response.json().catch(() => null)
  const message =
    isRecord(data) && typeof data.message === 'string' && data.message.trim()
      ? data.message.trim()
      : `A solicitação de publicações falhou (HTTP ${response.status}).`

  throw new Error(message)
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const data: unknown = await response.json().catch(() => null)
  if (data === null) {
    throw new Error('A resposta da API de publicações é inválida.')
  }
  return data
}

function postRequest(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
}

export async function listPosts(): Promise<Post[]> {
  const response = await fetchProtected(API_URL, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!Array.isArray(data) || !data.every(isPost)) {
    throw new Error('A resposta da lista de publicações é inválida.')
  }

  return data
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const response = await fetchProtected(API_URL, postRequest('POST', input))
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!isPost(data)) {
    throw new Error('A resposta da publicação criada é inválida.')
  }

  return data
}

export async function updatePost(postId: string, input: UpdatePostInput): Promise<Post> {
  const response = await fetchProtected(
    `${API_URL}/${encodeURIComponent(postId)}`,
    postRequest('PATCH', input),
  )
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!isPost(data)) {
    throw new Error('A resposta da publicação atualizada é inválida.')
  }

  return data
}

export async function deletePost(postId: string): Promise<DeletePostResponse> {
  const response = await fetchProtected(`${API_URL}/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!isRecord(data) || typeof data.message !== 'string' || typeof data.id !== 'string') {
    throw new Error('A resposta da exclusão da publicação é inválida.')
  }

  return {
    message: data.message,
    id: data.id,
  }
}

export async function setPostLike(postId: string): Promise<PostLikeResponse> {
  const response = await fetchProtected(`${API_URL}/${encodeURIComponent(postId)}/like`, {
    method: 'PUT',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!isRecord(data) || typeof data.liked !== 'boolean' || typeof data.likeCount !== 'number') {
    throw new Error('A resposta da curtida é inválida.')
  }

  return {
    liked: data.liked,
    likeCount: data.likeCount,
  }
}

export async function addPostComment(
  postId: string,
  content: string,
): Promise<PostComment> {
  const response = await fetchProtected(
    `${API_URL}/${encodeURIComponent(postId)}/comments`,
    postRequest('POST', { content }),
  )
  await ensureSuccessfulResponse(response)

  const data = await readJsonResponse(response)
  if (!isPostComment(data)) {
    throw new Error('A resposta do comentário é inválida.')
  }

  return data
}
