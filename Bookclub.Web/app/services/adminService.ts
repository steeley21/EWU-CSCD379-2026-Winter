import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { AdminUserDto, CreateAdminUserRequestDto } from '~/types/dtos'

export function createAdminService(http: AxiosInstance = api) {
  return {
    async createAdminUser(payload: CreateAdminUserRequestDto): Promise<AdminUserDto> {
      const res = await http.post<AdminUserDto>('/api/admin/users', payload)
      return res.data
    },
  }
}

export const adminService = createAdminService()