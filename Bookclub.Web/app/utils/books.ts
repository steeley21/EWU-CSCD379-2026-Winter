// app/utils/books.ts

export function extractIsbn(book: any): string | null {
  const raw = String(book?.isbn ?? book?.ISBN ?? '').trim()
  if (!raw) return null
  // handle "978...; 123..." or "978... 123..."
  const isbn = raw.split(/[,\s;]/).find(x => x && x.length >= 10) ?? ''
  return isbn || null
}

export function coverUrl(book: any, size: 'S' | 'M' | 'L' = 'M'): string | null {
  const isbn = extractIsbn(book)
  if (!isbn) return null
  return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-${size}.jpg?default=false`
}

export function authorLabel(book: any): string {
  const a = String(book?.author ?? '').trim()
  if (a) return a

  const combined = `${String(book?.authorFirst ?? '').trim()} ${String(book?.authorLast ?? '').trim()}`.trim()
  return combined || 'Unknown author'
}

export function publishDateLabel(book: any): string {
  const raw = book?.publishDate ?? book?.PublishDate
  if (!raw) return '—'
  const t = Date.parse(String(raw))
  if (!Number.isFinite(t)) return String(raw)
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(t))
}