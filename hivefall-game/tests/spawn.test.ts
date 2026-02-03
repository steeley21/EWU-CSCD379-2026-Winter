import { describe, it, expect } from 'vitest'
import { pickRandomEdgePos, findEdgeSpawnPos } from '../game/spawn'
import type { GridPos } from '../game/hivefallTypes'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

function isEdge(p: GridPos, rows: number, cols: number): boolean {
  return p.row === 0 || p.row === rows - 1 || p.col === 0 || p.col === cols - 1
}

describe('spawn', () => {
  it('pickRandomEdgePos always returns a position on an edge', () => {
    const rows = 10
    const cols = 12

    for (let i = 0; i < 100; i++) {
      const p = pickRandomEdgePos(rows, cols)
      expect(isEdge(p, rows, cols)).toBe(true)
    }
  })

  it('pickRandomEdgePos respects deterministic rng (example: top edge)', () => {
    const rows = 10
    const cols = 10

    // edge = floor(0.0*4) = 0 => top
    // col = floor(0.5*10) = 5
    const rng = seqRng([0.0, 0.5])
    const p = pickRandomEdgePos(rows, cols, rng)

    expect(p).toEqual({ row: 0, col: 5 })
  })

  it('findEdgeSpawnPos skips blocked positions and returns a later valid one', () => {
    const rows = 10
    const cols = 10

    // Attempt 1: edge=0 top, col=5 -> (0,5) (blocked)
    // Attempt 2: edge=1 bottom, col=2 -> (9,2) (allowed)
    const rng = seqRng([0.0, 0.5, 0.26, 0.2])

    const blocked: GridPos = { row: 0, col: 5 }
    const isBlocked = (p: GridPos) => p.row === blocked.row && p.col === blocked.col

    const pos = findEdgeSpawnPos(rows, cols, isBlocked, rng, 10)
    expect(pos).toEqual({ row: 9, col: 2 })
  })

  it('findEdgeSpawnPos returns null if all attempts are blocked', () => {
    const rows = 6
    const cols = 6

    const rng = seqRng([0.0, 0.1]) // always some edge, doesn’t matter
    const isBlocked = () => true

    const pos = findEdgeSpawnPos(rows, cols, isBlocked, rng, 3)
    expect(pos).toBeNull()
  })
})
