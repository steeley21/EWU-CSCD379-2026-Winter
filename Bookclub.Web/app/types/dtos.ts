// app/types/dtos.ts
export type AuthResponseDto = {
  token: string
  userId: string
  email: string
  username: string
  roles: string[]
}

export type RegisterRequestDto = {
  fname: string
  lname: string
  email: string
  username: string
  password: string
}

export type LoginRequestDto = {
  email: string
  password: string
}

// Keep book flexible (we only *require* id; UI uses fallbacks)
export type BookDto = {
  id: number
  title?: string
  author?: string
  description?: string
  createdAt?: string
  [k: string]: unknown
}

export type GroupDto = {
  id: number
  name?: string
  adminUserId?: string
  [k: string]: unknown
}