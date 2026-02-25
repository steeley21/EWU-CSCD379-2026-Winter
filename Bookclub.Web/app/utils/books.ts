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

  const s = String(raw).trim()
  if (!s) return '—'

  // If it's already a string that contains a year, prefer that.
  const m = s.match(/\b(19|20)\d{2}\b/)
  if (m) return m[0]

  const t = Date.parse(s)
  if (!Number.isFinite(t)) return s

  return String(new Date(t).getFullYear())
}

export function publishYearLabel(book: any): string | null {
  const raw = book?.publishDate ?? book?.PublishDate
  if (!raw) return null

  const t = Date.parse(String(raw))
  if (!Number.isFinite(t)) return null

  return String(new Date(t).getFullYear())
}