import type { BookDto } from '~/types/dtos'
import { booksService } from '~/services/booksService'
import { extractIsbn } from '~/utils/books'

type OpenLibraryDesc = string

// simple module cache (isbn -> description)
const descCache = new Map<string, OpenLibraryDesc>()

export function useBookPreviewDetail(bookId: Ref<number>) {
  const description = ref('')
  const descLoading = ref(false)
  const notFound = ref(false)

  const { data, pending, error } = useAsyncData<BookDto | null>(
    () => `preview-book-${bookId.value}`,
    async () => {
      notFound.value = false
      try {
        const b = await booksService.getById(Number(bookId.value))
        return b
      } catch (e: any) {
        // axios 404 -> treat as not found
        const status = Number(e?.response?.status ?? 0)
        if (status === 404) notFound.value = true
        return null
      }
    },
    { server: false, watch: [bookId] }
  )

  const book = computed(() => data.value)

  let descReqId = 0

  async function loadDescription() {
    description.value = ''
    const b = book.value
    const isbn = b ? extractIsbn(b) : null
    if (!isbn) return

    if (descCache.has(isbn)) {
      description.value = descCache.get(isbn) ?? ''
      return
    }

    const reqId = ++descReqId
    descLoading.value = true

    try {
      const isbnData: any = await fetch(
        `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`
      ).then((r) => {
        if (!r.ok) throw new Error('isbn lookup failed')
        return r.json()
      })

      if (reqId !== descReqId) return

      const directDesc = isbnData?.description
      const directText =
        typeof directDesc === 'string'
          ? directDesc
          : directDesc && typeof directDesc === 'object' && typeof directDesc.value === 'string'
            ? directDesc.value
            : ''

      if (directText) {
        descCache.set(isbn, directText)
        description.value = directText
        return
      }

      const workKey = Array.isArray(isbnData?.works) ? isbnData.works?.[0]?.key : null
      if (!workKey) return

      const workData: any = await fetch(`https://openlibrary.org${workKey}.json`).then((r) => {
        if (!r.ok) throw new Error('work lookup failed')
        return r.json()
      })

      if (reqId !== descReqId) return

      const workDesc = workData?.description
      const text =
        typeof workDesc === 'string'
          ? workDesc
          : workDesc && typeof workDesc === 'object' && typeof workDesc.value === 'string'
            ? workDesc.value
            : ''

      if (text) {
        descCache.set(isbn, text)
        description.value = text
      }
    } catch {
      // best-effort
    } finally {
      if (reqId === descReqId) descLoading.value = false
    }
  }

  watch(book, async (b) => {
    if (b) await loadDescription()
  })

  const pageError = computed(() => {
    if (notFound.value) return 'Book not found.'
    if (error.value) return 'Failed to load book.'
    return ''
  })

  return {
    book,
    pending,
    descLoading,
    description,
    pageError,
    notFound,
  }
}