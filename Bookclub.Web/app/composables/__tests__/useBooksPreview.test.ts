import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

const getAllMock = vi.hoisted(() => vi.fn())

vi.mock('~/services/booksService', () => ({
  booksService: {
    getAll: getAllMock,
  },
}))

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  getAllMock.mockReset()

  // Stub Nuxt's useAsyncData for node/Vitest
  vi.stubGlobal(
    'useAsyncData',
    ((key: any, handler: any) => {
      const data = ref<any>(null)
      const pending = ref(true)
      const error = ref<any>(null)
      const refresh = vi.fn(async () => {
        pending.value = true
        error.value = null
        try {
          data.value = await handler()
        } catch (e) {
          error.value = e
        } finally {
          pending.value = false
        }
      })

      // run once immediately
      refresh()

      return { data, pending, error, refresh }
    }) as any
  )
})

describe('useBooksPreview', () => {
  it('defaults to sorting by title (A–Z)', async () => {
    getAllMock.mockResolvedValue([
      { id: 2, title: 'Moby Dick', authorFirst: 'Herman', authorLast: 'Melville', publishDate: '1851-01-01T00:00:00', isbn: '9780142437247' },
      { id: 1, title: 'Hatchet', authorFirst: 'Gary', authorLast: 'Paulsen', publishDate: '1986-01-01T00:00:00', isbn: '9780807204771' },
      { id: 3, title: 'Pride and Prejudice', authorFirst: 'Jane', authorLast: 'Austen', publishDate: '1813-01-01T00:00:00', isbn: '9780141439518' },
    ])

    const { useBooksPreview } = await import('../useBooksPreview')
    const state = useBooksPreview()

    await flushPromises()
    await nextTick()

    const titles = state.books.value.map((b) => String(b.title))
    expect(titles).toEqual(['Hatchet', 'Moby Dick', 'Pride and Prejudice'])
  })

  it('filters by query (matches author, isbn, year, title)', async () => {
    getAllMock.mockResolvedValue([
      { id: 1, title: 'Hatchet', authorFirst: 'Gary', authorLast: 'Paulsen', publishDate: '1986-01-01T00:00:00', isbn: '9780807204771' },
      { id: 3, title: 'Pride and Prejudice', authorFirst: 'Jane', authorLast: 'Austen', publishDate: '1813-01-01T00:00:00', isbn: '9780141439518' },
    ])

    const { useBooksPreview } = await import('../useBooksPreview')
    const state = useBooksPreview()

    await flushPromises()
    await nextTick()

    state.query.value = 'austen'
    await nextTick()

    expect(state.books.value.map((b) => b.id)).toEqual([3])

    state.query.value = '1986'
    await nextTick()

    expect(state.books.value.map((b) => b.id)).toEqual([1])

    state.query.value = '9780141439518'
    await nextTick()

    expect(state.books.value.map((b) => b.id)).toEqual([3])
  })

  it('sorts by year (newest first) when sort=year', async () => {
    getAllMock.mockResolvedValue([
      { id: 10, title: 'Older', authorFirst: 'A', authorLast: 'A', publishDate: '1900-01-01T00:00:00', isbn: '1111111111' },
      { id: 11, title: 'Newer', authorFirst: 'B', authorLast: 'B', publishDate: '2000-01-01T00:00:00', isbn: '2222222222' },
      { id: 12, title: 'Newest', authorFirst: 'C', authorLast: 'C', publishDate: '2020-01-01T00:00:00', isbn: '3333333333' },
    ])

    const { useBooksPreview } = await import('../useBooksPreview')
    const state = useBooksPreview()

    await flushPromises()
    await nextTick()

    state.sort.value = 'year'
    await nextTick()

    expect(state.books.value.map((b) => b.id)).toEqual([12, 11, 10])
  })
})