// app/services/booksService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { BookDto } from '~/types/dtos'

export interface BookSearchResult {
    id: number | null        // null = not yet in your DB
    title: string
    authorFirst: string
    authorLast: string
    isbn: string | null
    publishYear: number | null
    source: 'db' | 'openlibrary'
}

export function createBooksService(http: AxiosInstance = api) {
    return {
        async getAll(): Promise<BookDto[]> {
            const res = await http.get<BookDto[]>('/api/Books')
            return res.data
        },

        async getById(id: number): Promise<BookDto> {
            const res = await http.get<BookDto>(`/api/Books/${id}`)
            return res.data
        },

        async create(payload: Partial<BookDto>): Promise<BookDto> {
            const res = await http.post<BookDto>('/api/Books', payload)
            return res.data
        },

        async update(id: number, payload: Partial<BookDto>): Promise<void> {
            await http.put(`/api/Books/${id}`, payload)
        },

        async remove(id: number): Promise<void> {
            await http.delete(`/api/Books/${id}`)
        },

        // Search DB first, then Open Library for the remainder
        async search(q: string): Promise<BookSearchResult[]> {
            const res = await http.get<BookSearchResult[]>('/api/Books/search', {
                params: { q },
            })
            return res.data
        },

        // Persist an Open Library result to your DB, returns the saved BookDto
        async saveFromCatalog(book: BookSearchResult): Promise<BookDto> {
            const res = await http.post<BookDto>('/api/Books/save-from-catalog', {
                title: book.title,
                authorFirst: book.authorFirst,
                authorLast: book.authorLast,
                isbn: book.isbn,
                publishYear: book.publishYear,
            })
            return res.data
        },
    }
}

export const booksService = createBooksService()