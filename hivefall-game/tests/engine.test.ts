// hivefall-game/tests/engine.test.ts
import { describe, it, expect } from 'vitest'
import { createInitialState, step } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'
import type { HivefallRules } from '../game/hivefallRules'
import type { HivefallState } from '../game/hivefallTypes'
import type { MoveDir } from '../game/engine'

/**
 * Deterministic RNG helper for spawn tests.
 * Returns values in a loop (0..1 range expected).
 */
function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

/**
 * Applies `n` moves and asserts they were all successful (moveCount advanced).
 * Returns the resulting state.
 */
function applySuccessfulMoves(
  state: HivefallState,
  rules: HivefallRules,
  n: number,
  move: (i: number, s: HivefallState) => MoveDir,
  rng?: () => number
): HivefallState {
  const startMoves = state.moveCount
  let s = state

  for (let i = 0; i < n; i++) {
    const dir = move(i, s)
    s = step(s, rules, dir, rng ? { rng } : undefined)
  }

  // "Successful moves" means moveCount increased exactly by n.
  expect(s.moveCount).toBe(startMoves + n)
  return s
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
    expect(s).toBe(before) // returns same object when no-op
    expect(s.moveCount).toBe(2)
  })

  it('spawns first enemy after N successful moves (appears on edge)', () => {
    const rules = mergeHivefallRules({
      rows: 10,
      cols: 10,
      firstSpawnAfterMoves: 5,
      maxEnemies: 10,
    })

    // rng sequence: edge=0 (top), col=0.5 (~middle) -> (0,5)
    const rng = seqRng([0, 0.5])

    let s = createInitialState(rules)

    // Alternate right/left to guarantee in-bounds success
    s = applySuccessfulMoves(
      s,
      rules,
      rules.firstSpawnAfterMoves,
      (i) => (i % 2 === 0 ? 'right' : 'left'),
      rng
    )

    expect(s.enemies.length).toBe(1)
    expect(s.enemies[0].pos.row).toBe(0) // top edge
    expect(s.grid[s.enemies[0].pos.row][s.enemies[0].pos.col].entity).toBe('enemy')
  })
})
