// app/composables/useOpenLibraryDescription.ts
import { ref } from 'vue'
import { extractIsbn } from '~/utils/books'

type Desc = string

// module cache: isbn -> description
const cache = new Map<string, Desc>()

export function useOpenLibraryDescription() {
  const description = ref('')
  const loading = ref(false)

  let requestId = 0

  function reset() {
    description.value = ''
  }

  async function loadForBook(book: any): Promise<void> {
    reset()

    const isbn = extractIsbn(book)
    if (!isbn) return

    if (cache.has(isbn)) {
      description.value = cache.get(isbn) ?? ''
      return
    }

    const reqId = ++requestId
    loading.value = true

    try {
      const isbnUrl = `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`
      const isbnResp = await fetch(isbnUrl)
      if (!isbnResp.ok) throw new Error('isbn lookup failed')

      const isbnData: any = await isbnResp.json()
      if (reqId !== requestId) return

      const directDesc = isbnData?.description
      const directText =
        typeof directDesc === 'string'
          ? directDesc
          : directDesc && typeof directDesc === 'object' && typeof directDesc.value === 'string'
            ? directDesc.value
            : ''

      if (directText) {
        cache.set(isbn, directText)
        description.value = directText
        return
      }

      const workKey = Array.isArray(isbnData?.works) ? isbnData.works?.[0]?.key : null
      if (!workKey) return

      const workUrl = `https://openlibrary.org${workKey}.json`
      const workResp = await fetch(workUrl)
      if (!workResp.ok) throw new Error('work lookup failed')

      const workData: any = await workResp.json()
      if (reqId !== requestId) return

      const workDesc = workData?.description
      const workText =
        typeof workDesc === 'string'
          ? workDesc
          : workDesc && typeof workDesc === 'object' && typeof workDesc.value === 'string'
            ? workDesc.value
            : ''

      if (workText) {
        cache.set(isbn, workText)
        description.value = workText
      }
    } catch {
      // best-effort
    } finally {
      if (reqId === requestId) loading.value = false
    }
  }

  return {
    description,
    loading,
    reset,
    loadForBook,
  }
}