import { describe, it, expect, vi } from 'vitest'
import type { AxiosInstance } from 'axios'
import { createBooksService } from '../booksService'

function makeHttpMock() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as AxiosInstance
}

describe('booksService', () => {
  it('getAll() calls /api/Books and normalizes id + fields', async () => {
    const http = makeHttpMock()
    ;(http.get as any).mockResolvedValue({
      data: [
        {
          bId: 1,
          authorFirst: 'Gary',
          authorLast: 'Paulsen',
          title: 'Hatchet',
          publishDate: '1986-01-01T00:00:00',
          isbn: '9780807204771',
        },
      ],
    })

    const svc = createBooksService(http)
    const books = await svc.getAll()

    expect(http.get).toHaveBeenCalledWith('/api/Books')
    expect(books).toHaveLength(1)

    const first = books.at(0)
    if (!first) throw new Error('Expected at least 1 book')

    expect(first.id).toBe(1)
    expect(first.title).toBe('Hatchet')
    expect(first.authorFirst).toBe('Gary')
    expect(first.authorLast).toBe('Paulsen')
    expect(first.publishDate).toBe('1986-01-01T00:00:00')
    expect(first.isbn).toBe('9780807204771')
  })

  it('getById() calls /api/Books/{id} and normalizes casing variants', async () => {
    const http = makeHttpMock()
    ;(http.get as any).mockResolvedValue({
      data: {
        BId: 7,
        AuthorFirst: 'Jane',
        AuthorLast: 'Austen',
        Title: 'Pride and Prejudice',
        PublishDate: '1813-01-01T00:00:00',
        ISBN: '9780141439518',
      },
    })

    const svc = createBooksService(http)
    const b = await svc.getById(7)

    expect(http.get).toHaveBeenCalledWith('/api/Books/7')

    expect(b.id).toBe(7)
    expect(b.title).toBe('Pride and Prejudice')
    expect(b.authorFirst).toBe('Jane')
    expect(b.authorLast).toBe('Austen')
    expect(b.publishDate).toBe('1813-01-01T00:00:00')
    expect(b.isbn).toBe('9780141439518')
  })

  it('getAll() returns empty array when API returns non-array', async () => {
    const http = makeHttpMock()
    ;(http.get as any).mockResolvedValue({ data: { not: 'an array' } })

    const svc = createBooksService(http)
    const books = await svc.getAll()

    expect(books).toEqual([])
  })
})