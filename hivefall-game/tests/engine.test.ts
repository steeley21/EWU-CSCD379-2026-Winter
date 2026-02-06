// tests/engine.test.ts
import { describe, it, expect } from 'vitest'
import { createInitialState, step } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'
import type { HivefallRules } from '../game/hivefallRules'
import type { HivefallState } from '../game/hivefallTypes'
import type { MoveDir } from '../game/engine'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

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
    expect(s.infecteds.length).toBe(0)
    expect(s.moveCount).toBe(0)
    expect(s.infectedCount).toBe(0)
  })

  it('increments moveCount only on successful move', () => {
    const rules = mergeHivefallRules({ rows: 4, cols: 4 })
    let s = createInitialState(rules)

    s = step(s, rules, 'up')
    expect(s.moveCount).toBe(1)

    s = step(s, rules, 'up')
    expect(s.moveCount).toBe(2)

    const before = s
    s = step(s, rules, 'up')
    expect(s).toBe(before)
    expect(s.moveCount).toBe(2)
  })

  it('spawns first enemy after N successful moves (appears on edge) and has hp/maxHp', () => {
    const rules = mergeHivefallRules({
      rows: 10,
      cols: 10,
      firstSpawnAfterMoves: 5,
      maxEnemies: 10,
      combat: { enemyMaxHp: 3, infectedHitDamage: 1 },
    })

    const rng = seqRng([0, 0.5])

    let s = createInitialState(rules)

    s = applySuccessfulMoves(
      s,
      rules,
      rules.firstSpawnAfterMoves,
      (i) => (i % 2 === 0 ? 'right' : 'left'),
      rng
    )

    expect(s.enemies.length).toBe(1)
    expect(s.enemies[0].pos.row).toBe(0)
    expect(s.enemies[0].hp).toBe(3)
    expect(s.enemies[0].maxHp).toBe(3)
    expect(s.grid[s.enemies[0].pos.row][s.enemies[0].pos.col].entity).toBe('enemy')
  })
})
