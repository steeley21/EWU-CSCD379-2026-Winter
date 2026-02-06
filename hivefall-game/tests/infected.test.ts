// tests/infected.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { HivefallState, Enemy } from '../game/hivefallTypes'
import { step } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('infecteds (auto-move + auto-damage)', () => {
  it('infected moves toward nearest enemy and damages it; infected dies on contact', () => {
    const rules = mergeHivefallRules({
      rows: 6,
      cols: 6,
      terrain: '.',
      combat: { enemyMaxHp: 5, infectedHitDamage: 2 },
      maxEnemies: 10,
    })

    const grid = createEmptyGrid(6, 6, '.')
    grid[0][0].entity = 'player'
    grid[2][2].entity = 'infected'
    grid[2][4].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 2, col: 4 }, hp: 5, maxHp: 5 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 0, col: 0 },
      enemies,
      infecteds: [{ id: 1, pos: { row: 2, col: 2 } }],

      moveCount: 0,
      infectedCount: 1,
      status: 'playing',
      playerHp: rules.playerMaxHp,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      fight: null,

      currentSpawnInterval: 999,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 2,
    }

    // one player move triggers infected step
    const next = step(state, rules, 'right')

    // infected should have advanced (or attacked if in range); after one move it should be at (2,3)
    // then enemy moves too; so don't assert exact infected position unless you want it strict.
    // We *can* assert enemy hp reduced only when contact occurs; to force contact, do 2 steps.
    const next2 = step(next, rules, 'right')

    const enemyAfter = next2.enemies.find(e => e.id === 1)
    expect(enemyAfter).not.toBeUndefined()
    expect(enemyAfter!.hp).toBe(3) // 5 - infectedHitDamage(2) after contact

    // infected dies on contact
    expect(next2.infecteds.length).toBe(0)
  })
})
