// app/services/forumService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { ForumPostDto, ForumPostDetailDto, ForumReplyDto } from '~/types/dtos'

type AnyRec = Record<string, any>

function toNumber(v: unknown): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
}

function toStr(v: unknown): string {
    return v == null ? '' : String(v)
}

// ─────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────

function normalizeReply(raw: AnyRec): ForumReplyDto | null {
    const frId = toNumber(raw.frId ?? raw.FrId ?? raw.id ?? raw.Id)
    if (!frId) return null

    return {
        frId,
        authorName: toStr(raw.authorName ?? raw.AuthorName ?? raw.userName ?? raw.UserName).trim() || 'Unknown',
        body: toStr(raw.body ?? raw.Body).trim(),
        createdAt: toStr(raw.createdAt ?? raw.CreatedAt),
    }
}

function normalizePost(raw: AnyRec): ForumPostDto | null {
    const fpId = toNumber(raw.fpId ?? raw.FpId ?? raw.id ?? raw.Id)
    if (!fpId) return null

    const body = toStr(raw.body ?? raw.Body).trim()

    return {
        fpId,
        category: toStr(raw.category ?? raw.Category).trim(),
        authorName: toStr(raw.authorName ?? raw.AuthorName ?? raw.userName ?? raw.UserName).trim() || 'Unknown',
        title: toStr(raw.title ?? raw.Title).trim(),
        body,
        preview: toStr(raw.preview ?? raw.Preview).trim() || (body.length > 80 ? body.slice(0, 80) + '...' : body),
        replyCount: toNumber(raw.replyCount ?? raw.ReplyCount),
        createdAt: toStr(raw.createdAt ?? raw.CreatedAt),
    }
}

function normalizePostDetail(raw: AnyRec): ForumPostDetailDto | null {
  const base = normalizePost(raw)
  if (!base) return null

  const repliesRaw = Array.isArray(raw.replies ?? raw.Replies) ? (raw.replies ?? raw.Replies) : []

  const replies = (repliesRaw as AnyRec[])
    .map(normalizeReply)
    .filter((r): r is ForumReplyDto => r != null)

  return {
    ...base,
    replies,
  }
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export function createForumService(http: AxiosInstance = api) {
    return {
        async getPosts(groupId: number, category: string): Promise<ForumPostDto[]> {
            const res = await http.get<AnyRec[]>(`/api/groups/${groupId}/forum/${category}`)
            const list = Array.isArray(res.data) ? res.data : []
            return list.map(normalizePost).filter((x): x is ForumPostDto => !!x)
        },

        async getPost(groupId: number, category: string, fpId: number): Promise<ForumPostDetailDto | null> {
            const res = await http.get<AnyRec>(`/api/groups/${groupId}/forum/${category}/${fpId}`)
            return res.data ? normalizePostDetail(res.data) : null
        },

        async createPost(groupId: number, category: string, payload: { title: string; body: string }): Promise<{ fpId: number }> {
            const res = await http.post<AnyRec>(`/api/groups/${groupId}/forum/${category}`, payload)
            return { fpId: toNumber(res.data?.fpId ?? res.data?.FpId) }
        },

        async createReply(groupId: number, category: string, fpId: number, payload: { body: string }): Promise<{ frId: number }> {
            const res = await http.post<AnyRec>(`/api/groups/${groupId}/forum/${category}/${fpId}/replies`, payload)
            return { frId: toNumber(res.data?.frId ?? res.data?.FrId) }
        },

        async deletePost(groupId: number, category: string, fpId: number): Promise<void> {
            await http.delete(`/api/groups/${groupId}/forum/${category}/${fpId}`)
        },
    }
}

export const forumService = createForumService()