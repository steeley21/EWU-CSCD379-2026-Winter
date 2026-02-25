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

  authorFirst?: string
  authorLast?: string
  publishDate?: string
  isbn?: string

  [k: string]: unknown
}

// --- Groups ---

export type CreateGroupRequestDto = {
  groupName: string
}

export type GroupSummaryDto = {
  groupId: number
  groupName: string
  adminId: string
  adminFullName?: string
  memberCount?: number
  [k: string]: unknown
}

export type GroupMemberDto = {
  userId: string
  fullName: string
  email?: string
  username?: string
  [k: string]: unknown
}

export type GroupScheduleDto = {
  gsId: number
  groupId: number
  book: BookDto
  dateTime: string // ISO
  duration: number
  location?: string | null
}

export type CreateGroupScheduleRequestDto = {
  bId: number
  dateTime: string // ISO
  duration: number
  location?: string | null
}

export type GroupBookDto = {
  gbId: number
  groupId: number
  book: BookDto
  avgRating?: number | null
  reviewCount?: number
}

export interface GroupInviteDto {
    inviteId: number
    groupId: number
    groupName: string
    adminFullName: string
    memberCount: number
}

export type GroupBookReviewDto = {
  reviewId: number
  gbId: number
  userId: string
  fullName: string
  rating: number
  comment?: string | null
  createdAt: string
  updatedAt: string
}

export type UpsertGroupBookReviewDto = {
  rating: number
  comment?: string | null
}

export type CreateAdminUserRequestDto = {
  email: string
  username: string
  fname: string
  lname: string
  password: string
}

export type AdminUserDto = {
  userId: string
  email: string
  username: string
  fullName: string
  roles: string[]
}