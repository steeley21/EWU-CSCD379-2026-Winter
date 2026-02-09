// composables/useHivefallApi.ts
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

export function useHivefallApi() {
  const config = useRuntimeConfig()

  const http = axios.create({
    baseURL: config.public.apiBase as string,
  })

  async function getLeaderboard(limit = 25): Promise<LeaderboardResponse> {
    const res = await http.get('/api/Leaderboard', { params: { limit } })
    return res.data
  }

  async function submitRun(dto: CreateRunResultDto): Promise<RunResultDto> {
    const res = await http.post('/api/Leaderboard', dto)
    return res.data
  }

  return { getLeaderboard, submitRun }
}
