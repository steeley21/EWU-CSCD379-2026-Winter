// app/composables/useBookPreviewDetail.ts
import { ref, computed, watch, onMounted, type Ref } from 'vue'
import type { BookDto } from '~/types/dtos'
import { booksService } from '~/services/booksService'
import { useOpenLibraryDescription } from '~/composables/useOpenLibraryDescription'

export function useBookPreviewDetail(bookId: Ref<number>) {
  const notFound = ref(false)

  const { data, pending, error, refresh } = useAsyncData<BookDto | null>(
    () => `preview-book-${bookId.value}`,
    async () => {
      notFound.value = false
      try {
        // IMPORTANT: use the PUBLIC endpoint so avgRating/reviewCount are included
        const b = await booksService.getPublicById(Number(bookId.value))
        return b
      } catch (e: any) {
        const status = Number(e?.response?.status ?? 0)
        if (status === 404) notFound.value = true
        return null
      }
    },
    { server: false, watch: [bookId] }
  )

  // extra safety: if Nuxt reuses cached asyncData, force a refresh on mount
  onMounted(() => refresh())

  const book = computed(() => data.value)

  const { description, loading: descLoading, reset, loadForBook } = useOpenLibraryDescription()
  watch(book, async (b) => {
    reset()
    if (b) await loadForBook(b)
  })

  const pageError = computed(() => {
    if (notFound.value) return 'Book not found.'
    if (error.value) return 'Failed to load book.'
    return ''
  })

  return { book, pending, descLoading, description, pageError, notFound, refresh }
}