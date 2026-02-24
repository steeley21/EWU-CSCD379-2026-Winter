import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { AdminUserDto, CreateAdminUserRequestDto, GroupSummaryDto } from '~/types/dtos'

export function createAdminService(http: AxiosInstance = api) {
    return {
        // ── Users ──────────────────────────────────────────────────────────────

        async createAdminUser(payload: CreateAdminUserRequestDto): Promise<AdminUserDto> {
            const res = await http.post<AdminUserDto>('/api/admin/users', payload)
            return res.data
        },

        async getAllUsers(): Promise<AdminUserDto[]> {
            const res = await http.get<AdminUserDto[]>('/api/admin/users')
            return res.data
        },

        async deleteUser(userId: string): Promise<void> {
            await http.delete(`/api/admin/users/${userId}`)
        },

        async setRole(userId: string, role: string, grant: boolean): Promise<AdminUserDto> {
            const res = await http.put<AdminUserDto>(`/api/admin/users/${userId}/roles`, { role, grant })
            return res.data
        },

        // ── Groups (reuses existing GroupsController endpoints) ────────────────

        async getAllGroups(): Promise<GroupSummaryDto[]> {
            const res = await http.get<GroupSummaryDto[]>('/api/groups')
            return res.data
        },

        async deleteGroup(groupId: number): Promise<void> {
            await http.delete(`/api/groups/${groupId}`)
        },
    }
}

export const adminService = createAdminService()