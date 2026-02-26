// app/services/userLibraryService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { BookDto, UserBookDto, AddToLibraryDto, UpdateUserBookDto } from '~/types/dtos'

type AnyRec = Record<string, any>

function toNumber(v: unknown): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
}

function toStr(v: unknown): string {
    return v == null ? '' : String(v)
}

function normalizeBook(raw: AnyRec): BookDto {
    return {
        id: toNumber(raw.bId ?? raw.BId ?? raw.id ?? raw.Id),
        title: toStr(raw.title ?? raw.Title),
        author: [toStr(raw.authorFirst ?? raw.AuthorFirst), toStr(raw.authorLast ?? raw.AuthorLast)].filter(Boolean).join(' '),
        authorFirst: toStr(raw.authorFirst ?? raw.AuthorFirst),
        authorLast: toStr(raw.authorLast ?? raw.AuthorLast),
        publishDate: raw.publishDate ?? raw.PublishDate ?? null,
        isbn: raw.isbn ?? raw.ISBN ?? null,
    }
}

function normalizeUserBook(raw: AnyRec): UserBookDto | null {
    const ubId = toNumber(raw.ubId ?? raw.UbId ?? raw.UBID)
    if (!ubId) return null

    const bookRaw = raw.book ?? raw.Book
    if (!bookRaw) return null

    return {
        ubId,
        book: normalizeBook(bookRaw),
        status: (raw.status ?? raw.Status ?? 0) as 0 | 1 | 2,
        rating: raw.rating != null ? Number(raw.rating) : null,
        addedAt: toStr(raw.addedAt ?? raw.AddedAt),
    }
}

export function createUserLibraryService(http: AxiosInstance = api) {
    return {
        async getAll(): Promise<UserBookDto[]> {
            const res = await http.get<AnyRec[]>('/api/library')
            const list = Array.isArray(res.data) ? res.data : []
            return list.map(normalizeUserBook).filter((x): x is UserBookDto => !!x)
        },

        async add(payload: AddToLibraryDto): Promise<UserBookDto | null> {
            const res = await http.post<AnyRec>('/api/library', payload)
            return res.data ? normalizeUserBook(res.data) : null
        },

        async update(ubId: number, payload: UpdateUserBookDto): Promise<UserBookDto | null> {
            const res = await http.patch<AnyRec>(`/api/library/${ubId}`, payload)
            return res.data ? normalizeUserBook(res.data) : null
        },

        async remove(ubId: number): Promise<void> {
            await http.delete(`/api/library/${ubId}`)
        },
    }
}

export const userLibraryService = createUserLibraryService()