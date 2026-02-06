// tests/spawn.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import { step } from '../game/engine'
import type { HivefallState } from '../game/hivefallTypes'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('spawn cap', () => {
  it('does not spawn more than maxEnemies total even if enemies list is smaller', () => {
    const rules = mergeHivefallRules({
      rows: 5,
      cols: 5,
      terrain: '.',
      maxEnemies: 2,
      firstSpawnAfterMoves: 1,
      spawnPacing: { minInterval: 1, decreaseEverySpawns: 1, step: 1 },
      playerMaxHp: 10,
      combat: { infectedHitDamage: 1 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies: [],
      infecteds: [],
      moveCount: 0,
      fight: null,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },

      currentSpawnInterval: 1,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3,   // spawnedSoFar = 2 (at cap)
      nextInfectedId: 1,
    }

    const next = step(state, rules, 'right', { rng: () => 0 })

    expect(next.nextEnemyId).toBe(3)
    expect(next.enemies.length).toBe(0)
  })
})
