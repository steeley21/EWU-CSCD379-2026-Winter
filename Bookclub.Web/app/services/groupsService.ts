// app/services/groupsService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type {
  BookDto,
  CreateGroupRequestDto,
  CreateGroupScheduleRequestDto,
  GroupBookDto,
  GroupMemberDto,
  GroupScheduleDto,
  GroupSummaryDto,
  GroupInviteDto
} from '~/types/dtos'

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

function normalizeGroup(raw: AnyRec): GroupSummaryDto | null {
  const groupId = toNumber(raw.groupId ?? raw.groupID ?? raw.id ?? raw.GroupId ?? raw.GroupID ?? raw.GroupID)
  if (!groupId) return null

  const groupName = toStr(raw.groupName ?? raw.name ?? raw.GroupName).trim()

  const adminId = toStr(
    raw.adminId ?? raw.adminID ?? raw.adminUserId ?? raw.AdminId ?? raw.AdminID ?? raw.AdminID
  ).trim()

  const adminFullName =
    raw.adminFullName != null
      ? String(raw.adminFullName)
      : raw.AdminFullName != null
        ? String(raw.AdminFullName)
        : undefined

  const memberCount =
    raw.memberCount != null
      ? toNumber(raw.memberCount)
      : raw.MemberCount != null
        ? toNumber(raw.MemberCount)
        : undefined

  return {
    groupId,
    groupName: groupName || `Group ${groupId}`,
    adminId,
    adminFullName,
    memberCount,
    ...raw,
  }
}

function normalizeMember(raw: AnyRec): GroupMemberDto | null {
  const userId = toStr(raw.userId ?? raw.userID ?? raw.UserID ?? raw.id ?? raw.Id).trim()
  if (!userId) return null

  // Your API UserGroupDto: (UGID, UserID, FullName, Username)
  const fullName = toStr(raw.fullName ?? raw.FullName).trim()
  const username = toStr(raw.username ?? raw.Username ?? raw.userName ?? raw.UserName).trim()

  // fallback if some fields ever change
  const fname = toStr(raw.fname ?? raw.firstName ?? raw.FirstName).trim()
  const lname = toStr(raw.lname ?? raw.lastName ?? raw.LastName).trim()
  const fullFromParts = `${fname} ${lname}`.trim()

  const finalName = fullName || fullFromParts || username || `Member ${userId.slice(0, 6)}`

  return {
    userId,
    fullName: finalName,
    username: username || undefined,
    // email isn't provided by your UserGroupDto, but keep optional if backend changes later
    email: raw.email ?? raw.Email ?? undefined,
    ...raw,
  }
}

function normalizeBook(raw: AnyRec): BookDto | null {
  const b = (raw.book ?? raw.Book ?? raw) as AnyRec

  const id = toNumber(b.id ?? b.bookId ?? b.BookId ?? b.bId ?? b.BId ?? b.BID)
  if (!id) return null

  const title = toStr(b.title ?? b.Title).trim()

  const authorFirst = toStr(b.authorFirst ?? b.AuthorFirst).trim()
  const authorLast  = toStr(b.authorLast ?? b.AuthorLast).trim()
  const authorCombined = `${authorFirst} ${authorLast}`.trim()

  return {
    ...b,
    id,
    title: title || `Book ${id}`,
    author: toStr(b.author ?? b.Author).trim() || authorCombined || 'Unknown author',
    isbn: (b.isbn ?? b.ISBN ?? null),
  }
}


function normalizeGroupBook(raw: AnyRec): GroupBookDto | null {
  const gbId = toNumber(raw.gbId ?? raw.gbid ?? raw.GBID ?? raw.id ?? raw.Id)
  const groupId = toNumber(raw.groupId ?? raw.groupID ?? raw.GroupID ?? raw.GroupId)

  const bookRaw = raw.book ?? raw.Book
  const book = bookRaw ? normalizeBook(bookRaw) : null

  if (!gbId || !groupId || !book) return null

  const avgRaw = raw.avgRating ?? raw.AvgRating
  const avgRating = avgRaw == null ? null : Number(avgRaw)

  const reviewCount = toNumber(raw.reviewCount ?? raw.ReviewCount ?? 0)

  return {
    ...raw,
    gbId,
    groupId,
    book,
    avgRating: Number.isFinite(avgRating as number) ? (avgRating as number) : null,
    reviewCount,
  }
}

function normalizeSchedule(raw: AnyRec): GroupScheduleDto | null {
  // API GroupScheduleDto: (GSID, GroupID, Book, DateTime, Duration, Location)
  const gsId = toNumber(raw.gsId ?? raw.gsid ?? raw.GSID ?? raw.id ?? raw.Id)
  const groupId = toNumber(raw.groupId ?? raw.groupID ?? raw.GroupID ?? raw.GroupId)
  const bookRaw = raw.book ?? raw.Book
  const book = bookRaw ? normalizeBook(bookRaw) : null

  const dtRaw = raw.dateTime ?? raw.DateTime
  const t = dtRaw ? Date.parse(String(dtRaw)) : NaN
  const dateTime = Number.isFinite(t) ? new Date(t).toISOString() : ''

  const duration = toNumber(raw.duration ?? raw.Duration)
  const location = (raw.location ?? raw.Location) as string | null | undefined

  if (!gsId || !groupId || !book || !dateTime) return null

  return {
    ...raw,
    gsId,
    groupId,
    book,
    dateTime,
    duration,
    location: location ?? null,
  }
}

function normalizeInvite(raw: AnyRec): GroupInviteDto | null {
  const inviteId = toNumber(raw.inviteId ?? raw.ugid ?? raw.UGID ?? raw.id ?? raw.Id)
  const groupId = toNumber(raw.groupId ?? raw.groupID ?? raw.GroupID ?? raw.GroupId)
  const groupName = toStr(raw.groupName ?? raw.GroupName).trim()
  const adminFullName = toStr(raw.adminFullName ?? raw.AdminFullName).trim()
  const memberCount = toNumber(raw.memberCount ?? raw.MemberCount ?? 0)

  if (!inviteId || !groupId) return null

  return { inviteId, groupId, groupName, adminFullName, memberCount }
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export function createGroupsService(http: AxiosInstance = api) {
  return {
    async getAll(): Promise<GroupSummaryDto[]> {
        const res = await http.get<AnyRec[]>('/api/groups/mine')
        const list = Array.isArray(res.data) ? res.data : []
        return list.map(normalizeGroup).filter((x): x is GroupSummaryDto => !!x)
    },

    async getById(groupId: number): Promise<GroupSummaryDto | null> {
      const res = await http.get<AnyRec>(`/api/groups/${groupId}`)
      return res.data ? normalizeGroup(res.data) : null
    },

    async create(payload: CreateGroupRequestDto): Promise<GroupSummaryDto | null> {
      const res = await http.post<AnyRec>('/api/groups', payload)
      return res.data ? normalizeGroup(res.data) : null
    },

    async getMembers(groupId: number): Promise<GroupMemberDto[]> {
      const res = await http.get<AnyRec[]>(`/api/groups/${groupId}/members`)
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeMember).filter((x): x is GroupMemberDto => !!x)
    },

    /**
     * NOTE: API endpoint returns GroupBookDto (GBID, GroupID, Book)
     * For the profile page we often only need the Book list, so we expose both:
     * - getGroupBooks(): returns GroupBookDto[] (includes gbId for delete)
     * - getBooks(): returns BookDto[] for display convenience
     */
    async getGroupBooks(groupId: number): Promise<GroupBookDto[]> {
      const res = await http.get<AnyRec[]>(`/api/groups/${groupId}/books`)
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeGroupBook).filter((x): x is GroupBookDto => !!x)
    },

    async getBooks(groupId: number): Promise<BookDto[]> {
      const groupBooks = await this.getGroupBooks(groupId)
      return groupBooks.map(gb => gb.book)
    },

    async getSchedule(groupId: number): Promise<GroupScheduleDto[]> {
      const res = await http.get<AnyRec[]>(`/api/groups/${groupId}/schedule`)
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeSchedule).filter((x): x is GroupScheduleDto => !!x)
    },

    async addSchedule(groupId: number, payload: CreateGroupScheduleRequestDto): Promise<{ gsId: number }> {
      // Backend expects CreateGroupScheduleDto: BId, DateTime, Duration, Location
      // CamelCase is fine in ASP.NET; it binds case-insensitively by default.
      const res = await http.post<AnyRec>(`/api/groups/${groupId}/schedule`, payload)
      const gsId = toNumber(res.data?.gsId ?? res.data?.GSID)
      return { gsId }
    },

    async deleteSchedule(groupId: number, gsId: number): Promise<void> {
      await http.delete(`/api/groups/${groupId}/schedule/${gsId}`)
    },

    async addBook(groupId: number, bookId: number): Promise<void> {
        await http.post(`/api/groups/${groupId}/books/${bookId}`)
    },

    async removeBook(groupId: number, gbId: number): Promise<void> {
        await http.delete(`/api/groups/${groupId}/books/${gbId}`)
    },

    async inviteMember(groupId: number, email: string): Promise<void> {
        await http.post(`/api/groups/${groupId}/invite`, { email })
    },

    async getPendingInvites(): Promise<GroupInviteDto[]> {
        const res = await http.get('/api/groups/my-invites')
        const list = Array.isArray(res.data) ? res.data : []
        return list.map(normalizeInvite).filter((x): x is GroupInviteDto => !!x)
    },

    async acceptInvite(inviteId: number): Promise<void> {
        await http.post(`/api/groups/invites/${inviteId}/accept`)
    },

    async declineInvite(inviteId: number): Promise<void> {
        await http.post(`/api/groups/invites/${inviteId}/decline`)
    },

    async deleteGroup(groupId: number): Promise<void> {
        await http.delete(`/api/groups/${groupId}`)
    },

    async leaveGroup(groupId: number): Promise<void> {
        await http.post(`/api/groups/${groupId}/leave`)
    },
  }
}

export const groupsService = createGroupsService()