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

type AnyRec = Record<string, any>

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function normalizeBook(raw: AnyRec): BookDto {
  const id = toNumber(raw.id ?? raw.bId ?? raw.BId ?? raw.bookId ?? raw.BookId)

  return {
    ...raw,
    id,
    title: raw.title ?? raw.Title,
    authorFirst: raw.authorFirst ?? raw.AuthorFirst,
    authorLast: raw.authorLast ?? raw.AuthorLast,
    publishDate: raw.publishDate ?? raw.PublishDate,
    isbn: raw.isbn ?? raw.ISBN,
  }
}

export function createBooksService(http: AxiosInstance = api) {
  return {
    async getAll(): Promise<BookDto[]> {
      const res = await http.get<AnyRec[]>('/api/Books')
      const list = Array.isArray(res.data) ? res.data : []
      return list.map(normalizeBook)
    },

    async getById(id: number): Promise<BookDto> {
      const res = await http.get<AnyRec>(`/api/Books/${id}`)
      return normalizeBook(res.data ?? {})
    },

    // NOTE: your backend expects CreateBookDto (AuthorFirst, AuthorLast, Title, PublishDate, ISBN)
    // If you're still using admin/books.vue with {title, author, description}, that will 400 until you update the form.
    async create(payload: any): Promise<BookDto> {
      const res = await http.post<AnyRec>('/api/Books', payload)
      return normalizeBook(res.data ?? {})
    },

    async update(id: number, payload: any): Promise<void> {
      await http.put(`/api/Books/${id}`, payload)
    },

    async remove(id: number): Promise<void> {
      await http.delete(`/api/Books/${id}`)
    },

    async search(q: string): Promise<BookSearchResult[]> {
      const res = await http.get<BookSearchResult[]>('/api/Books/search', {
        params: { q },
      })
      return Array.isArray(res.data) ? res.data : []
    },

    async saveFromCatalog(book: BookSearchResult): Promise<BookDto> {
      const res = await http.post<AnyRec>('/api/Books/save-from-catalog', {
        title: book.title,
        authorFirst: book.authorFirst,
        authorLast: book.authorLast,
        isbn: book.isbn,
        publishYear: book.publishYear,
      })
      return normalizeBook(res.data ?? {})
    },
  }
}

export const booksService = createBooksService()