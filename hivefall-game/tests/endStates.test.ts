// hivefall-game/tests/fightResolution.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, giveUp, tickEnemyHit, endFight } from '../game/engine'
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
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 1,
    }

    const next = giveUp(state)
    expect(next.status).toBe('lost')
  })

  it('enemy hit tick can cause lose when hp reaches 0 (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 1,
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
      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1, // force a hit on next tick
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 1,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 1)

    expect(next.status).toBe('lost')
    expect(next.playerHp).toBe(0)
    expect(next.fight).toBeNull()
  })

  it('tickEnemyHit is ignored during interlude', () => {
    const rules = mergeHivefallRules({
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        weaponCooldownMsRemaining: {},
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 50)
    expect(next).toBe(state)
    expect(next.playerHp).toBe(10)
  })

  it('fight tick decrements weapon cooldown over time (combat only)', () => {
    const rules = mergeHivefallRules({
      weapons: { hit: { cooldownMs: 800 } },
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 800 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1500,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 50)
    expect(next.fight?.weaponCooldownMsRemaining.hit).toBe(750)
    expect(next.playerHp).toBe(10)
  })

  it('enemy timer resets to interval after an enemy hit occurs (combat only)', () => {
    const rules = mergeHivefallRules({
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: 1,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 1)

    expect(next.status).toBe('playing')
    expect(next.playerHp).toBe(8) // default enemyHitDamage=2
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
  })

  it('game win triggers only after Continue closes the won dialog (endFight)', () => {
    const rules = mergeHivefallRules({
      maxEnemies: 2,
      combat: { enemyMaxHp: 1 },
      weapons: { hit: { damage: 1, cooldownMs: 0 } },
    })

    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 2, pos: { row: 1, col: 1 } }]

    const state: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      moveCount: 0,
      fight: {
        enemyId: 2,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      infectedCount: 1,
      status: 'playing',
      playerHp: 10,
      inventory: { weapons: ['hit'], charges: {}, food: 0 },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3, // spawnedTotal = 2 (== maxEnemies)
    }

    // killing blow puts fight into phase 'won' (does NOT clear fight)
    const afterKill = resolveFight(state, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterKill.status).toBe('playing')
    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.enemies.length).toBe(0)
    expect(afterKill.infectedCount).toBe(2)

    // Continue closes fight and allows win evaluation
    const afterContinue = endFight(afterKill, rules)
    expect(afterContinue.fight).toBeNull()
    expect(afterContinue.status).toBe('won')
  })
})
