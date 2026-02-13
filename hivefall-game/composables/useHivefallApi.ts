import axios from 'axios'

export type CreateRunResultDto = {
  playerName: string
  won: boolean
  moveCount: number
  infectedCount: number
}

export type RunResultDto = CreateRunResultDto & {
  id: number
  finishedAtUtc: string
}

export type LeaderboardResponse = {
  entries: RunResultDto[]
  serverTimeUtc: string
}

/* ---- Reviews ---- */
export type CreateReviewDto = {
  name?: string | null
  rating: 5
  comment?: string | null
}

export type ReviewDto = {
  id: number
  name: string
  rating: number
  comment: string | null
  createdAtUtc: string
}

export type ReviewsResponse = {
  reviews: ReviewDto[]
  totalCount: number
  averageRating: number
  serverTimeUtc: string
}

export function useHivefallApi() {
  const config = useRuntimeConfig()

  const http = axios.create({
    baseURL: config.public.apiBase as string,
    timeout: 20000,
  })

  async function getLeaderboard(limit = 25): Promise<LeaderboardResponse> {
    const res = await http.get('/api/Leaderboard', { params: { limit } })
    return res.data
  }

  async function submitRun(dto: CreateRunResultDto): Promise<RunResultDto> {
    const res = await http.post('/api/Leaderboard', dto)
    return res.data
  }

  async function getReviews(limit = 5): Promise<ReviewsResponse> {
    const res = await http.get('/api/Reviews', { params: { limit } })
    return res.data
  }

  async function submitReview(dto: CreateReviewDto): Promise<ReviewDto> {
    const res = await http.post('/api/Reviews', dto)
    return res.data
  }

  return { getLeaderboard, submitRun, getReviews, submitReview }
}
