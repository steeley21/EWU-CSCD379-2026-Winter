import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy } from '../game/hivefallTypes'
import { resolveFight, giveUp, type HivefallState } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('end states', () => {
  it('giveUp sets status lost', () => {
    const rules = mergeHivefallRules()
    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies: [],
      moveCount: 0,
      fight: null,
      infectedCount: 0,
      status: 'playing',
      playerHp: rules.playerMaxHp,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 1,
    }

    const next = giveUp(state)
    expect(next.status).toBe('lost')
  })

  it('resolving fight can cause lose when hp reaches 0', () => {
    const rules = mergeHivefallRules({ playerMaxHp: 1, damagePerFight: 1 })
    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      moveCount: 0,
      fight: { enemyId: 1 },
      infectedCount: 0,
      status: 'playing',
      playerHp: 1,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, 'attack')
    expect(next.status).toBe('lost')
    expect(next.playerHp).toBe(0)
  })

  it('win triggers when all enemies spawned and all infected and none alive', () => {
    const rules = mergeHivefallRules({ maxEnemies: 2, playerMaxHp: 10, damagePerFight: 0 })
    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 2, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      moveCount: 0,
      fight: { enemyId: 2 },
      infectedCount: 1,      // already infected one
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3,        // spawnedTotal = 2 (== maxEnemies)
    }

    const next = resolveFight(state, rules, 'attack')
    expect(next.status).toBe('won')
    expect(next.enemies.length).toBe(0)
    expect(next.infectedCount).toBe(2)
  })
})
