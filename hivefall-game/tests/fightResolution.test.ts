// hivefall-game/tests/fightResolution.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, engageFight, endFight, tickEnemyHit } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('fight resolution (weapons)', () => {
  it('attack is ignored during interlude (must engage first)', () => {
    const rules = mergeHivefallRules()

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
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        weaponCooldownMsRemaining: {},
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })
    expect(next).toBe(state)
    expect(next.fight?.phase).toBe('interlude')
    expect(next.fight?.enemyHp).toBe(5)
  })

  it('engageFight transitions interlude -> combat and resets cooldown map', () => {
    const rules = mergeHivefallRules()

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
      playerHp: rules.playerMaxHp,

      inventory: { weapons: ['hit', 'sword'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        weaponCooldownMsRemaining: { hit: 123 }, // should be reset
        enemyStunMsRemaining: 999,
        enemyHitMsUntilNext: 123,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = engageFight(state, rules)
    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
    expect(next.fight?.enemyStunMsRemaining).toBe(0)
    expect(next.fight?.weaponCooldownMsRemaining.hit).toBe(0)
    expect(next.fight?.weaponCooldownMsRemaining.sword).toBe(0)
  })

  it('run clears fight but leaves enemy unchanged (interlude or combat)', () => {
    const rules = mergeHivefallRules()

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
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, { kind: 'run' })

    expect(next.fight).toBeNull()
    expect(next.enemies.length).toBe(1)
    expect(next.grid[1][1].entity).toBe('enemy')
    expect(next.infectedCount).toBe(0)
    expect(next.status).toBe('playing')
    expect(next.playerHp).toBe(10)
  })

  it('weapons cooldown independently (hit ready while sword is cooling down)', () => {
    const rules = mergeHivefallRules({
      weapons: {
        hit: { cooldownMs: 500, damage: 1 },
        sword: { cooldownMs: 1000, damage: 2 },
      },
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

      inventory: { weapons: ['hit', 'sword'], charges: {}, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 10,
        enemyMaxHp: 10,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0, sword: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const afterSword = resolveFight(state, rules, { kind: 'attack', weaponId: 'sword' })
    expect(afterSword.fight?.enemyHp).toBe(8)
    expect(afterSword.fight?.weaponCooldownMsRemaining.sword).toBe(1000)
    expect(afterSword.fight?.weaponCooldownMsRemaining.hit).toBe(0)

    // hit should still work immediately
    const afterHit = resolveFight(afterSword, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterHit.fight?.enemyHp).toBe(7)
    expect(afterHit.fight?.weaponCooldownMsRemaining.hit).toBe(500)
  })

  it('grenade consumes charges and becomes disabled at 0 (stays visible)', () => {
    const rules = mergeHivefallRules({
      weapons: {
        grenade: { damage: 5, cooldownMs: 1000, consumable: true },
      },
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

      inventory: { weapons: ['hit', 'grenade'], charges: { grenade: 2 }, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 20,
        enemyMaxHp: 20,
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

    const after1 = resolveFight(state, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(after1.inventory.charges.grenade).toBe(1)

    // tick to clear grenade cooldown
    const after1Tick = tickEnemyHit(after1, rules, 1000)
    expect(after1Tick.fight?.weaponCooldownMsRemaining.grenade).toBe(0)

    const after2 = resolveFight(after1Tick, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(after2.inventory.charges.grenade).toBe(0)

    // tick to clear cooldown again
    const after2Tick = tickEnemyHit(after2, rules, 1000)
    expect(after2Tick.fight?.weaponCooldownMsRemaining.grenade).toBe(0)

    // now grenade should be ignored (no charges)
    const noOp = resolveFight(after2Tick, rules, { kind: 'attack', weaponId: 'grenade' })
    expect(noOp).toBe(after2Tick)
    expect(noOp.inventory.charges.grenade).toBe(0)
  })

  it('stun grenade pauses enemy attacks and resets timer when stun ends', () => {
    const rules = mergeHivefallRules({
      weapons: {
        stun_grenade: { consumable: true, stunMs: 200, cooldownMs: 0, damage: 0 },
      },
      combat: {
        enemyHitIntervalMs: 150,
        enemyHitDamage: 2,
      },
      playerMaxHp: 10,
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

      inventory: { weapons: ['hit', 'stun_grenade'], charges: { stun_grenade: 1 }, food: 0 },

      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0, stun_grenade: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1, // would hit immediately if not stunned
        drops: [],
      },

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const stunned = resolveFight(state, rules, { kind: 'attack', weaponId: 'stun_grenade' })
    expect(stunned.fight?.enemyStunMsRemaining).toBeGreaterThan(0)

    // during stun: no hit, hp unchanged
    const during = tickEnemyHit(stunned, rules, 50)
    expect(during.playerHp).toBe(10)

    // end stun: timer resets to interval
    const endStun = tickEnemyHit(stunned, rules, 250)
    expect(endStun.playerHp).toBe(10)
    expect(endStun.fight?.enemyStunMsRemaining).toBe(0)
    expect(endStun.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
  })

  it('killing blow switches to won phase and keeps dialog open until endFight()', () => {
    const rules = mergeHivefallRules({
      weapons: {
        hit: { damage: 1, cooldownMs: 0 },
      },
      combat: { enemyMaxHp: 1 },
      playerMaxHp: 10,
      maxEnemies: 10,
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

    const afterKill = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })

    expect(afterKill.fight).not.toBeNull()
    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.enemies.length).toBe(0)
    expect(afterKill.infectedCount).toBe(1)
    expect(afterKill.grid[1][1].entity).toBe('infected')
    expect(afterKill.status).toBe('playing') // still open until Continue

    const afterContinue = endFight(afterKill, rules)
    expect(afterContinue.fight).toBeNull()
  })
})
