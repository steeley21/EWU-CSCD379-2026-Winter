import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy } from '../game/hivefallTypes'
import { resolveFight, type HivefallState } from '../game/engine'

describe('fight resolution', () => {
  it('attack converts enemy to infected, removes enemy, clears fight', () => {
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
      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, 'attack')
    expect(next.fight).toBeNull()
    expect(next.enemies.length).toBe(0)
    expect(next.infectedCount).toBe(1)
    expect(next.grid[1][1].entity).toBe('infected')
  })

  it('run clears fight but leaves enemy unchanged', () => {
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
      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, 'run')
    expect(next.fight).toBeNull()
    expect(next.enemies.length).toBe(1)
    expect(next.grid[1][1].entity).toBe('enemy')
    expect(next.infectedCount).toBe(0)
  })
})
