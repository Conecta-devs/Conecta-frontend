export interface AuthUser {
  sub?: string
  name: string
  email: string
  course?: string
  bio?: string
  gen?: string
  image?: string | null
}
