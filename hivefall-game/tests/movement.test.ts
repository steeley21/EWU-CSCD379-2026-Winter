// tests/movement.test.ts
import { describe, it, expect } from 'vitest'
import { addPos, attemptMove, dirDelta, inBounds, type MoveDir } from '../game/movement'
import type { GridPos } from '../game/hivefallTypes'

describe('movement', () => {
  it('dirDelta maps directions to correct deltas', () => {
    const cases: Array<[MoveDir, { dr: number; dc: number }]> = [
      ['up', { dr: -1, dc: 0 }],
      ['down', { dr: 1, dc: 0 }],
      ['left', { dr: 0, dc: -1 }],
      ['right', { dr: 0, dc: 1 }],
    ]

    for (const [dir, delta] of cases) {
      expect(dirDelta(dir)).toEqual(delta)
    }
  })

  it('addPos applies a delta to a position', () => {
    const p: GridPos = { row: 5, col: 7 }
    expect(addPos(p, { dr: -2, dc: 3 })).toEqual({ row: 3, col: 10 })
  })

  it('inBounds returns true only for positions inside the grid', () => {
    expect(inBounds({ row: 0, col: 0 }, 4, 4)).toBe(true)
    expect(inBounds({ row: 3, col: 3 }, 4, 4)).toBe(true)

    expect(inBounds({ row: -1, col: 0 }, 4, 4)).toBe(false)
    expect(inBounds({ row: 0, col: -1 }, 4, 4)).toBe(false)
    expect(inBounds({ row: 4, col: 0 }, 4, 4)).toBe(false)
    expect(inBounds({ row: 0, col: 4 }, 4, 4)).toBe(false)
  })

  it('attemptMove returns ok=true for valid moves', () => {
    const from: GridPos = { row: 2, col: 2 }
    const r = attemptMove(from, 'left', 5, 5)
    expect(r).toEqual({ ok: true, to: { row: 2, col: 1 } })
  })

  it('attemptMove returns out_of_bounds for invalid moves', () => {
    const from: GridPos = { row: 0, col: 0 }
    const r = attemptMove(from, 'up', 5, 5)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('out_of_bounds')
      expect(r.to).toEqual({ row: -1, col: 0 })
    }
  })

  it('attemptMove returns blocked when isBlocked rejects the destination', () => {
    const from: GridPos = { row: 2, col: 2 }
    const isBlocked = (to: GridPos) => to.row === 2 && to.col === 3

    const r = attemptMove(from, 'right', 5, 5, isBlocked)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('blocked')
      expect(r.to).toEqual({ row: 2, col: 3 })
    }
  })
})
