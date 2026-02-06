// tests/endStates.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, giveUp, tickEnemyHit, endFight, chooseWonOutcome } from '../game/engine'
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
      infecteds: [],
      moveCount: 0,
      fight: null,
      infectedCount: 0,
      status: 'playing',
      playerHp: rules.playerMaxHp,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 1,
      nextInfectedId: 1,
    }

    const next = giveUp(state)
    expect(next.status).toBe('lost')
  })

  it('enemy hit tick can cause lose when hp reaches 0 (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 1,
      combat: { enemyHitDamage: 2 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 1, maxHp: 1 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      infecteds: [],
      moveCount: 0,
      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 1,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const next = tickEnemyHit(state, rules, 1)
    expect(next.status).toBe('lost')
    expect(next.playerHp).toBe(0)
    expect(next.fight).toBeNull()
  })

  it('win triggers after: choose outcome removes last enemy AND Continue closes fight', () => {
    const rules = mergeHivefallRules({
      maxEnemies: 1,
      combat: { enemyMaxHp: 1, infectedHitDamage: 1 },
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 1, maxHp: 1 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      infecteds: [],
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2, // spawnedTotal = 1 == maxEnemies ✅
      nextInfectedId: 1,
    }

    const afterKill = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.status).toBe('playing')

    const afterChoice = chooseWonOutcome(afterKill, rules, 'harvest')
    expect(afterChoice.enemies.length).toBe(0)
    expect(afterChoice.fight?.wonChoice).toBe('harvest')

    const afterContinue = endFight(afterChoice, rules)
    expect(afterContinue.fight).toBeNull()
    expect(afterContinue.status).toBe('won')
  })
})
