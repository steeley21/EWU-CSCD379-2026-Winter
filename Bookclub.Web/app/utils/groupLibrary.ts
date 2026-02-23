// app/utils/groupLibrary.ts
import type { GroupScheduleDto } from '~/types/dtos'

function readBookId(book: any): number {
  const n = Number(book?.id ?? book?.bId ?? book?.BId ?? book?.bookId ?? book?.BookId)
  return Number.isFinite(n) ? n : 0
}

export function buildScheduleIndex(schedule: GroupScheduleDto[]): Map<number, string[]> {
  const m = new Map<number, string[]>()

  for (const s of schedule ?? []) {
    const bid = readBookId((s as any)?.book)
    if (bid <= 0) continue

    const dt = String((s as any)?.dateTime ?? '')
    if (!dt) continue

    const arr = m.get(bid) ?? []
    arr.push(dt)
    m.set(bid, arr)
  }

  // sort each array ascending
  for (const [k, arr] of m.entries()) {
    arr.sort((a, b) => Date.parse(a) - Date.parse(b))
    m.set(k, arr)
  }

  return m
}