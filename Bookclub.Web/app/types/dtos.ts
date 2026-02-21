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

export type GroupSummaryDto = {
  groupId: number
  groupName: string
  adminId: string
  adminFullName?: string
  memberCount?: number
  [k: string]: unknown
}

export type CreateGroupRequestDto = {
  groupName: string
}