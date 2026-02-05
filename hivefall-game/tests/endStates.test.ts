// hivefall-game/tests/endStates.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, giveUp, tickEnemyHit, endFight } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('end states', () => {
  const combatDefaults = {
    enemyMaxHp: 5,
    playerHitDamage: 1,
    playerHitCooldownMs: 800,
    enemyHitDamage: 2,
    enemyHitIntervalMs: 1500,
  }

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

  it('enemy hit tick can cause lose when hp reaches 0 (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 1,
      combat: combatDefaults,
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
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: 1, // force a hit on next tick
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 1,
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
      combat: combatDefaults,
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
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: 1, // would hit if combat, but should not
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 50)
    expect(next).toBe(state)
    expect(next.playerHp).toBe(10)
  })

  it('fight tick decrements player cooldown over time (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      combat: combatDefaults,
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
        playerHitCooldownMsRemaining: 800,
        enemyHitMsUntilNext: 1500, // avoid triggering enemy hit
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 50)
    expect(next.fight?.playerHitCooldownMsRemaining).toBe(750)
    expect(next.playerHp).toBe(10)
  })

  it('enemy timer resets to interval after an enemy hit occurs (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      combat: combatDefaults,
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
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: 1, // guaranteed hit
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = tickEnemyHit(state, rules, 1)

    expect(next.status).toBe('playing')
    expect(next.playerHp).toBe(8) // enemyHitDamage = 2
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
  })

  it('game win triggers only after Continue closes the won dialog (endFight)', () => {
    const rules = mergeHivefallRules({
      maxEnemies: 2,
      playerMaxHp: 10,
      combat: combatDefaults,
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
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      infectedCount: 1,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3, // spawnedTotal = 2 (== maxEnemies)
    }

    // killing blow puts fight into phase 'won' (does NOT clear fight)
    const afterKill = resolveFight(state, rules, 'attack')
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
