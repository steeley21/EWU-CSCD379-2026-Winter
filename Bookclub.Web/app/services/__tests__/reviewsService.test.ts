// app/services/__tests__/reviewsService.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createReviewsService } from '../reviewsService'
import type { UpsertGroupBookReviewDto } from '~/types/dtos'

describe('reviewsService', () => {
  it('getReviews calls correct endpoint and normalizes', async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: [
          {
            reviewId: 10,
            gbId: 7,
            userId: 'u1',
            fullName: 'Flava Flav',
            rating: 4.25,
            comment: 'Nice',
            createdAt: '2026-02-24T00:00:00Z',
            updatedAt: '2026-02-24T01:00:00Z',
          },
        ],
      }),
    } as any

    const svc = createReviewsService(http)
    const out = await svc.getReviews(1, 7)

    expect(http.get).toHaveBeenCalledWith('/api/groups/1/books/7/reviews')
    expect(out).toHaveLength(1)

    const first = out.at(0)! // ✅ avoids "possibly undefined"
    expect(first.reviewId).toBe(10)
    expect(first.gbId).toBe(7)
    expect(first.rating).toBe(4.25)
  })

  it('upsertMyReview calls correct endpoint and returns normalized review', async () => {
    const payload: UpsertGroupBookReviewDto = { rating: 3.75, comment: null }

    const http = {
      put: vi.fn().mockResolvedValue({
        data: {
          ReviewId: 11,
          GBID: 9,
          UserID: 'u2',
          FullName: 'Test User',
          Rating: 3.75,
          Comment: null,
          CreatedAt: '2026-02-24T00:00:00Z',
          UpdatedAt: '2026-02-24T02:00:00Z',
        },
      }),
    } as any

    const svc = createReviewsService(http)
    const out = await svc.upsertMyReview(2, 9, payload)

    expect(http.put).toHaveBeenCalledWith('/api/groups/2/books/9/reviews/me', payload)
    expect(out.reviewId).toBe(11)
    expect(out.gbId).toBe(9)
    expect(out.userId).toBe('u2')
    expect(out.rating).toBe(3.75)
  })

  it('deleteMyReview calls correct endpoint', async () => {
    const http = { delete: vi.fn().mockResolvedValue({}) } as any
    const svc = createReviewsService(http)

    await svc.deleteMyReview(3, 12)
    expect(http.delete).toHaveBeenCalledWith('/api/groups/3/books/12/reviews/me')
  })

  it('deleteReview calls correct endpoint', async () => {
    const http = { delete: vi.fn().mockResolvedValue({}) } as any
    const svc = createReviewsService(http)

    await svc.deleteReview(3, 12, 99)
    expect(http.delete).toHaveBeenCalledWith('/api/groups/3/books/12/reviews/99')
  })
})