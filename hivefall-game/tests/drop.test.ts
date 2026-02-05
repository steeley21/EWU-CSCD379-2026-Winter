import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => values[i++ % values.length]
}

describe('drops + food', () => {
  it('food can drop (+1) on kill', () => {
    const rules = mergeHivefallRules({
      drops: { foodChance: 1, weaponChance: 0 },
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
      combat: { enemyMaxHp: 1 },
      playerMaxHp: 20,
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
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
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' }, { rng: seqRng([0]) })

    expect(next.fight?.phase).toBe('won')
    expect(next.inventory.food).toBe(1)
    expect(next.fight?.drops.join(' ')).toContain('Food')
  })

  it('weapon can drop and becomes owned (non-consumable)', () => {
    const rules = mergeHivefallRules({
      drops: { foodChance: 0, weaponChance: 1 },
      weapons: {
        hit: { damage: 1, cooldownMs: 0 },
        sword: { dropWeight: 1 },
        handgun: { dropWeight: 0 },
        laser_rifle: { dropWeight: 0 },
        grenade: { dropWeight: 0 },
        stun_grenade: { dropWeight: 0 },
      },
      combat: { enemyMaxHp: 1 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
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
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    // rng used for: weapon chance, then weapon pick
    const next = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' }, { rng: seqRng([0, 0]) })

    expect(next.inventory.weapons).toContain('sword')
    expect(next.fight?.drops.join(' ')).toContain('Sword')
  })

  it('consumable weapon drop grants +1 charge even if already owned', () => {
    const rules = mergeHivefallRules({
      drops: { foodChance: 0, weaponChance: 1 },
      weapons: {
        hit: { damage: 1, cooldownMs: 0 },
        grenade: { consumable: true, dropWeight: 1 },
        sword: { dropWeight: 0 },
        handgun: { dropWeight: 0 },
        laser_rifle: { dropWeight: 0 },
        stun_grenade: { dropWeight: 0 },
      },
      combat: { enemyMaxHp: 1 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      inventory: { weapons: ['hit', 'grenade'], charges: { grenade: 1 }, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0, grenade: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' }, { rng: seqRng([0, 0]) })

    expect(next.inventory.charges.grenade).toBe(2)
    expect(next.fight?.drops.join(' ')).toContain('Grenade')
  })

  it('use_food heals +10 (capped) and consumes 1 food (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 20,
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies: [],
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 15,

      inventory: { weapons: ['hit'], charges: {}, food: 1 },

      fight: {
        enemyId: 99,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 1,
    }

    const healed = resolveFight(state, rules, { kind: 'use_food' })
    expect(healed.playerHp).toBe(20)
    expect(healed.inventory.food).toBe(0)

    // Not usable in interlude
    const interlude: HivefallState = { ...state, fight: { ...state.fight!, phase: 'interlude' } }
    const noOp = resolveFight(interlude, rules, { kind: 'use_food' })
    expect(noOp).toBe(interlude)
  })
})
