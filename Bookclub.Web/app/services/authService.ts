// app/services/authService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '~/types/dtos'

export function createAuthService(http: AxiosInstance = api) {
  return {
    async login(payload: LoginRequestDto): Promise<AuthResponseDto> {
      const res = await http.post<AuthResponseDto>('/api/Auth/login', payload)
      return res.data
    },

    async register(payload: RegisterRequestDto): Promise<AuthResponseDto> {
      const res = await http.post<AuthResponseDto>('/api/Auth/register', payload)
      return res.data
    },
  }
}

export const authService = createAuthService()