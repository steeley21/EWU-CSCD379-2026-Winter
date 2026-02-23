import { describe, it, expect } from 'vitest'
import { buildScheduleIndex } from '../groupLibrary'

describe('buildScheduleIndex', () => {
  it('groups by book id and sorts dates ascending', () => {
    const schedule: any[] = [
      { book: { id: 5 }, dateTime: '2026-02-01T10:00:00Z' },
      { book: { id: 5 }, dateTime: '2025-01-01T10:00:00Z' },
      { book: { id: 7 }, dateTime: '2025-06-01T10:00:00Z' },
    ]

    const m = buildScheduleIndex(schedule as any)

    expect(m.get(5)).toEqual([
      '2025-01-01T10:00:00Z',
      '2026-02-01T10:00:00Z',
    ])
    expect(m.get(7)).toEqual(['2025-06-01T10:00:00Z'])
  })

  it('ignores missing/invalid book ids and empty dateTime', () => {
    const schedule: any[] = [
      { book: { id: 0 }, dateTime: '2025-01-01T10:00:00Z' },
      { book: null, dateTime: '2025-01-01T10:00:00Z' },
      { book: { id: 5 }, dateTime: '' },
    ]

    const m = buildScheduleIndex(schedule as any)
    expect(m.size).toBe(0)
  })
})