// app/services/reviewsService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { GroupBookReviewDto, UpsertGroupBookReviewDto } from '~/types/dtos'

type AnyRec = Record<string, any>

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function toStr(v: unknown): string {
  return v == null ? '' : String(v)
}

function toIso(v: unknown): string {
  const t = v ? Date.parse(String(v)) : NaN
  return Number.isFinite(t) ? new Date(t).toISOString() : ''
}

function normalizeReview(raw: AnyRec): GroupBookReviewDto | null {
  const reviewId = toNumber(raw.reviewId ?? raw.ReviewId ?? raw.id ?? raw.Id)
  const gbId = toNumber(raw.gbId ?? raw.GBID ?? raw.gbid)
  const userId = toStr(raw.userId ?? raw.userID ?? raw.UserID).trim()
  const fullName = toStr(raw.fullName ?? raw.FullName).trim()
  const rating = toNumber(raw.rating ?? raw.Rating)

  const createdAt = toIso(raw.createdAt ?? raw.CreatedAt)
  const updatedAt = toIso(raw.updatedAt ?? raw.UpdatedAt)
  const comment = (raw.comment ?? raw.Comment) as string | null | undefined

  if (!reviewId || !gbId || !userId) return null
  if (!createdAt || !updatedAt) return null

  return {
    reviewId,
    gbId,
    userId,
    fullName: fullName || `Member ${userId.slice(0, 6)}`,
    rating,
    comment: comment ?? null,
    createdAt,
    updatedAt,
  }
}

export function createReviewsService(http: AxiosInstance = api) {
  return {
    async getReviews(groupId: number, gbId: number): Promise<GroupBookReviewDto[]> {
      const res = await http.get<AnyRec[]>(`/api/groups/${groupId}/books/${gbId}/reviews`)
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeReview).filter((x): x is GroupBookReviewDto => !!x)
    },

    async upsertMyReview(
      groupId: number,
      gbId: number,
      payload: UpsertGroupBookReviewDto
    ): Promise<GroupBookReviewDto> {
      const res = await http.put<AnyRec>(`/api/groups/${groupId}/books/${gbId}/reviews/me`, payload)
      const normalized = res.data ? normalizeReview(res.data) : null
      if (!normalized) throw new Error('Invalid review response from API.')
      return normalized
    },

    async deleteMyReview(groupId: number, gbId: number): Promise<void> {
      await http.delete(`/api/groups/${groupId}/books/${gbId}/reviews/me`)
    },

    async deleteReview(groupId: number, gbId: number, reviewId: number): Promise<void> {
      await http.delete(`/api/groups/${groupId}/books/${gbId}/reviews/${reviewId}`)
    },
  }
}

export const reviewsService = createReviewsService()