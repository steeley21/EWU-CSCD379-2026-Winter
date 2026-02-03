import { describe, it, expect } from 'vitest'
import { createInitialState, step } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('engine', () => {
  it('creates initial state with player centered', () => {
    const rules = mergeHivefallRules({ rows: 14, cols: 24 })
    const s = createInitialState(rules)

    expect(s.playerPos).toEqual({ row: 7, col: 12 })
    expect(s.grid[7][12].entity).toBe('player')
    expect(s.enemies.length).toBe(0)
    expect(s.moveCount).toBe(0)
  })

  it('increments moveCount only on successful move', () => {
    const rules = mergeHivefallRules({ rows: 4, cols: 4 })
    let s = createInitialState(rules)

    // move up from center (2,2) -> (1,2) valid
    s = step(s, rules, 'up')
    expect(s.moveCount).toBe(1)

    // keep moving up until out of bounds
    s = step(s, rules, 'up') // (0,2) valid
    expect(s.moveCount).toBe(2)

    const before = s
    s = step(s, rules, 'up') // out of bounds, no advance
    expect(s).toBe(before)   // returns same object when no-op
    expect(s.moveCount).toBe(2)
  })

  it('spawns first enemy after N successful moves (appears on edge)', () => {
    const rules = mergeHivefallRules({ rows: 10, cols: 10, firstSpawnAfterMoves: 5, maxEnemies: 10 })

    let s = createInitialState(rules)

    // rng: edge=0 (top), col=5 -> (0,5)
    const rng = seqRng([0.0, 0.5])

    for (let i = 0; i < 5; i++) {
      s = step(s, rules, 'right', { rng })
    }

    expect(s.enemies.length).toBe(1)
    expect(s.enemies[0].pos.row).toBe(0) // top edge
    expect(s.grid[s.enemies[0].pos.row][s.enemies[0].pos.col].entity).toBe('enemy')
  })
})
