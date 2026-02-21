// app/services/groupsService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { CreateGroupRequestDto, GroupSummaryDto } from '~/types/dtos'

type AnyGroup = Record<string, any>

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Normalizes API responses whether they come back as:
 * - groupId / adminId (camelCase typical)
 * - groupID / adminID (older or custom)
 * - id / name (fallback)
 */
function normalizeGroup(raw: AnyGroup): GroupSummaryDto | null {
  const groupId = toNumber(raw.groupId ?? raw.groupID ?? raw.id)
  if (!groupId) return null

  const groupName = String(raw.groupName ?? raw.name ?? '').trim()
  const adminId = String(raw.adminId ?? raw.adminID ?? raw.adminUserId ?? '').trim()

  const adminFullName =
    raw.adminFullName != null ? String(raw.adminFullName) : undefined

  const memberCount =
    raw.memberCount != null ? toNumber(raw.memberCount) : undefined

  return {
    groupId,
    groupName: groupName || `Group ${groupId}`,
    adminId,
    adminFullName,
    memberCount,
    ...raw,
  }
}

export function createGroupsService(http: AxiosInstance = api) {
  return {
    async getAll(): Promise<GroupSummaryDto[]> {
      const res = await http.get<AnyGroup[]>('/api/groups')
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeGroup).filter((x): x is GroupSummaryDto => !!x)
    },

    async create(payload: CreateGroupRequestDto): Promise<GroupSummaryDto | null> {
      const res = await http.post<AnyGroup>('/api/groups', payload)
      return res.data ? normalizeGroup(res.data) : null
    },
  }
}

export const groupsService = createGroupsService()