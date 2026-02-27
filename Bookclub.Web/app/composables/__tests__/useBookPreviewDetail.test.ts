import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'

const getPublicByIdMock = vi.hoisted(() => vi.fn())
const resetMock = vi.hoisted(() => vi.fn())
const loadForBookMock = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('~/services/booksService', () => ({
  booksService: {
    getPublicById: getPublicByIdMock,
  },
}))

vi.mock('~/composables/useOpenLibraryDescription', () => ({
  useOpenLibraryDescription: () => ({
    description: { value: '' },
    loading: { value: false },
    reset: resetMock,
    loadForBook: loadForBookMock,
  }),
}))

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  getPublicByIdMock.mockReset()
  resetMock.mockReset()
  loadForBookMock.mockReset()

  // Stub Nuxt's useAsyncData for node/Vitest
  vi.stubGlobal('useAsyncData', ((key: any, handler: any) => {
    const data = ref<any>(null)
    const pending = ref(true)
    const error = ref<any>(null)

    Promise.resolve()
      .then(() => handler())
      .then((res) => { data.value = res })
      .catch((e) => { error.value = e })
      .finally(() => { pending.value = false })

    return { data, pending, error }
  }) as any)
})

describe('useBookPreviewDetail', () => {
  it('loads book and calls OpenLibrary loader', async () => {
    const book = { id: 1, title: 'Hatchet', isbn: '9780807204771', avgRating: 4.0, reviewCount: 1 }
    getPublicByIdMock.mockResolvedValue(book)

    const { useBookPreviewDetail } = await import('../useBookPreviewDetail')

    const id = ref(1)
    const state = useBookPreviewDetail(id)

    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(getPublicByIdMock).toHaveBeenCalledWith(1)
    expect(resetMock).toHaveBeenCalled()
    expect(loadForBookMock).toHaveBeenCalledWith(book)
    expect(state.book.value?.id).toBe(1)
  })

  it('sets notFound + pageError on 404 and does not call OpenLibrary loader', async () => {
    getPublicByIdMock.mockRejectedValue({ response: { status: 404 } })

    const { useBookPreviewDetail } = await import('../useBookPreviewDetail')

    const id = ref(999)
    const state = useBookPreviewDetail(id)

    await flushPromises()
    await nextTick()
    await flushPromises()

    expect(state.notFound.value).toBe(true)
    expect(state.pageError.value).toBe('Book not found.')
    expect(loadForBookMock).not.toHaveBeenCalled()
  })
})