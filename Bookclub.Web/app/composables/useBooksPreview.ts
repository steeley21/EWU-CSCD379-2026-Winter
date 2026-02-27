// app/composables/useBooksPreview.ts
import { ref, computed } from 'vue'
import type { BookDto } from '~/types/dtos'
import { booksService } from '~/services/booksService'
import { authorLabel, extractIsbn, publishYearLabel } from '~/utils/books'

export type BooksPreviewSort = 'title' | 'author' | 'year' | 'id'

export function useBooksPreview() {
  const query = ref('')
  const sort = ref<BooksPreviewSort>('title')

  const { data, pending, error, refresh } = useAsyncData<BookDto[]>(
    'preview-books',
    () => booksService.getPublicAll(),
    { server: false }
  )

  const books = computed(() => data.value ?? [])

  const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    let list = books.value

    if (q) {
      list = list.filter((b) => {
        const title = String(b.title ?? '').toLowerCase()
        const author = authorLabel(b).toLowerCase()
        const isbn = String(extractIsbn(b) ?? '').toLowerCase()
        const year = String(publishYearLabel(b) ?? '').toLowerCase()
        return title.includes(q) || author.includes(q) || isbn.includes(q) || year.includes(q)
      })
    }

    const sorted = [...list].sort((a, b) => {
      switch (sort.value) {
        case 'author':
          return authorLabel(a).localeCompare(authorLabel(b))
        case 'year':
          // newest year first
          return String(publishYearLabel(b) ?? '').localeCompare(String(publishYearLabel(a) ?? ''))
        case 'id':
          return Number(b.id ?? 0) - Number(a.id ?? 0)
        case 'title':
        default:
          return String(a.title ?? '').localeCompare(String(b.title ?? ''))
      }
    })

    return sorted
  })

  const pageError = computed(() => {
    if (!error.value) return ''
    return 'Failed to load books. Is the API running?'
  })

  return {
    query,
    sort,
    books: filtered,
    pending,
    pageError,
    refresh,
  }
}