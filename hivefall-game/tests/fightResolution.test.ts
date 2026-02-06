// tests/fightResolution.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, engageFight, tickEnemyHit } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('fight resolution (weapons)', () => {
  it('attack is ignored during interlude (must engage first)', () => {
    const rules = mergeHivefallRules()

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 5, maxHp: 5 }]

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
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        wonChoice: null,

        weaponCooldownMsRemaining: {},
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const next = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })
    expect(next).toBe(state)
  })

  it('engageFight transitions interlude -> combat and resets cooldown map', () => {
    const rules = mergeHivefallRules()

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 5, maxHp: 5 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      infecteds: [],
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: rules.playerMaxHp,

      inventory: { weapons: ['hit', 'sword'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 123 },
        enemyStunMsRemaining: 999,
        enemyHitMsUntilNext: 123,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const next = engageFight(state, rules)
    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
    expect(next.fight?.enemyStunMsRemaining).toBe(0)
    expect(next.fight?.weaponCooldownMsRemaining.hit).toBe(0)
    expect(next.fight?.weaponCooldownMsRemaining.sword).toBe(0)
  })

  it('weapons cooldown independently (hit ready while sword is cooling down)', () => {
    const rules = mergeHivefallRules({
      weapons: {
        hit: { cooldownMs: 500, damage: 1 },
        sword: { cooldownMs: 1000, damage: 2 },
      },
      combat: { enemyMaxHp: 10, infectedHitDamage: 1 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 10, maxHp: 10 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      infecteds: [],
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      inventory: { weapons: ['hit', 'sword'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 10,
        enemyMaxHp: 10,
        phase: 'combat',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0, sword: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const afterSword = resolveFight(state, rules, { kind: 'attack', weaponId: 'sword' })
    expect(afterSword.fight?.enemyHp).toBe(8)
    expect(afterSword.fight?.weaponCooldownMsRemaining.sword).toBe(1000)
    expect(afterSword.fight?.weaponCooldownMsRemaining.hit).toBe(0)

    const afterHit = resolveFight(afterSword, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterHit.fight?.enemyHp).toBe(7)
    expect(afterHit.fight?.weaponCooldownMsRemaining.hit).toBe(500)
  })

  it('killing blow switches to won phase and does NOT remove enemy until choice', () => {
    const rules = mergeHivefallRules({
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
      combat: { enemyMaxHp: 1, infectedHitDamage: 1 },
      playerMaxHp: 10,
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

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const afterKill = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })

    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.enemies.length).toBe(1) // ✅ still present
    expect(afterKill.status).toBe('playing')
  })

  it('grenade consumes charges and becomes ignored at 0', () => {
    const rules = mergeHivefallRules({
      weapons: { grenade: { damage: 5, cooldownMs: 1000, consumable: true } },
      combat: { enemyMaxHp: 20, infectedHitDamage: 1 },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 20, maxHp: 20 }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      infecteds: [],
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      inventory: { weapons: ['hit', 'grenade'], charges: { grenade: 2 }, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 20,
        enemyMaxHp: 20,
        phase: 'combat',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0, grenade: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
      nextInfectedId: 1,
    }

    const after1 = resolveFight(state, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(after1.inventory.charges.grenade).toBe(1)

    const after1Tick = tickEnemyHit(after1, rules, 1000)
    expect(after1Tick.fight?.weaponCooldownMsRemaining.grenade).toBe(0)

    const after2 = resolveFight(after1Tick, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(after2.inventory.charges.grenade).toBe(0)

    const after2Tick = tickEnemyHit(after2, rules, 1000)
    expect(after2Tick.fight?.weaponCooldownMsRemaining.grenade).toBe(0)

    const noOp = resolveFight(after2Tick, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(noOp).toBe(after2Tick)
  })
})
