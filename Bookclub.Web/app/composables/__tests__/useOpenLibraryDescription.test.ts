import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useOpenLibraryDescription } from '../useOpenLibraryDescription'

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useOpenLibraryDescription', () => {
  it('loads direct ISBN description and caches it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ description: 'Direct description' }),
    })

    vi.stubGlobal('fetch', fetchMock as any)

    const { description, loadForBook } = useOpenLibraryDescription()

    await loadForBook({ isbn: '9780807204771' })
    expect(description.value).toBe('Direct description')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // second call should hit cache (no extra fetch)
    await loadForBook({ isbn: '9780807204771' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to work description when ISBN has none', async () => {
    const fetchMock = vi
      .fn()
      // isbn endpoint (no description, has work key)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ works: [{ key: '/works/OL123W' }] }),
      })
      // work endpoint (has description)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ description: { value: 'Work description' } }),
      })

    vi.stubGlobal('fetch', fetchMock as any)

    const { description, loadForBook } = useOpenLibraryDescription()

    await loadForBook({ isbn: '9780141439518' })
    expect(description.value).toBe('Work description')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})