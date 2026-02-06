// tests/drop.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, chooseWonOutcome } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('victory outcome: Harvest / Acquire', () => {
  it('killing blow does NOT grant food until Harvest choice', () => {
    const rules = mergeHivefallRules({
      drops: { weaponChance: 0, foodChance: 0 },
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
      combat: { enemyMaxHp: 1, infectedHitDamage: 1 },
      maxEnemies: 10,
      playerMaxHp: 20,
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
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const afterKill = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' }, { rng: seqRng([0]) })

    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.inventory.food).toBe(0) // ✅ not yet

    const afterHarvest = chooseWonOutcome(afterKill, rules, 'harvest', { rng: seqRng([0]) })
    expect(afterHarvest.fight?.wonChoice).toBe('harvest')
    expect(afterHarvest.inventory.food).toBe(1) // ✅ food granted here
    expect(afterHarvest.enemies.length).toBe(0)
  })

  it('Acquire creates an infected on the defeated enemy tile and increments total infected', () => {
    const rules = mergeHivefallRules({
      drops: { weaponChance: 0, foodChance: 0 },
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
      combat: { enemyMaxHp: 1, infectedHitDamage: 1 },
      maxEnemies: 10,
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
      playerHp: rules.playerMaxHp,

      inventory: { weapons: ['hit'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 0,
        enemyMaxHp: 1,
        phase: 'won',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const afterAcquire = chooseWonOutcome(state, rules, 'acquire', { rng: seqRng([0]) })

    expect(afterAcquire.fight?.wonChoice).toBe('acquire')
    expect(afterAcquire.enemies.length).toBe(0)
    expect(afterAcquire.infectedCount).toBe(1)
    expect(afterAcquire.infecteds.length).toBe(1)
    expect(afterAcquire.infecteds[0].pos).toEqual({ row: 1, col: 1 })
    expect(afterAcquire.grid[1][1].entity).toBe('infected')
  })

  it('weapon victory drop can grant a weapon (applies on Harvest too)', () => {
    const rules = mergeHivefallRules({
      drops: { weaponChance: 1, foodChance: 0 },
      weapons: {
        hit: { damage: 1, cooldownMs: 0 },
        sword: { dropWeight: 1 },
        handgun: { dropWeight: 0 },
        laser_rifle: { dropWeight: 0 },
        grenade: { dropWeight: 0 },
        stun_grenade: { dropWeight: 0 },
      },
      combat: { enemyMaxHp: 1, infectedHitDamage: 1 },
      maxEnemies: 10,
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
      playerHp: rules.playerMaxHp,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 0,
        enemyMaxHp: 1,
        phase: 'won',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    // rng: weaponChance pass, then weapon pick roll
    const afterHarvest = chooseWonOutcome(state, rules, 'harvest', { rng: seqRng([0, 0]) })

    expect(afterHarvest.inventory.weapons).toContain('sword')
    expect((afterHarvest.fight?.drops ?? []).join(' ')).toContain('Sword')
  })
})
