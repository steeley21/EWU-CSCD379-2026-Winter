// app/services/booksService.ts
import type { AxiosInstance } from 'axios'
import { api } from './api'
import type { BookDto } from '~/types/dtos'

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
  }
}

export const booksService = createBooksService()