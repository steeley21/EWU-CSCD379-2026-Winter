// hivefall-game/tests/fightResolution.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { resolveFight, engageFight, endFight } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('fight resolution', () => {
  it('attack is ignored during interlude (must engage first)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      combat: {
        enemyMaxHp: 5,
        playerHitDamage: 1,
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, 'attack')
    expect(next).toBe(state)
    expect(next.fight?.phase).toBe('interlude')
    expect(next.fight?.enemyHp).toBe(5)
  })

  it('engageFight transitions interlude -> combat', () => {
    const rules = mergeHivefallRules({
      combat: {
        enemyMaxHp: 5,
        playerHitDamage: 1,
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: 123,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: rules.playerMaxHp,
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = engageFight(state, rules)
    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
  })

  it('run clears fight but leaves enemy unchanged (interlude or combat)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      maxEnemies: 10,
      combat: {
        enemyMaxHp: 5,
        playerHitDamage: 1,
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'interlude',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, 'run')

    expect(next.fight).toBeNull()
    expect(next.enemies.length).toBe(1)
    expect(next.grid[1][1].entity).toBe('enemy')
    expect(next.infectedCount).toBe(0)
    expect(next.status).toBe('playing')
    expect(next.playerHp).toBe(10)
  })

  it('attack is ignored while cooldown is active (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      combat: {
        enemyMaxHp: 5,
        playerHitDamage: 1,
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        playerHitCooldownMsRemaining: 250, // on cooldown
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, 'attack')

    expect(next).toBe(state)
    expect(next.fight?.enemyHp).toBe(5)
    expect(next.fight?.playerHitCooldownMsRemaining).toBe(250)
  })

  it('attack applies damage and sets cooldown when enemy survives (combat only)', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      combat: {
        enemyMaxHp: 10,
        playerHitDamage: 1,
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 10,
        enemyMaxHp: 10,
        phase: 'combat',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const next = resolveFight(state, rules, 'attack')

    expect(next.fight).not.toBeNull()
    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.enemyHp).toBe(9)
    expect(next.fight?.playerHitCooldownMsRemaining).toBe(rules.combat.playerHitCooldownMs)
  })

  it('killing blow switches to won phase and keeps dialog open until endFight()', () => {
    const rules = mergeHivefallRules({
      playerMaxHp: 10,
      maxEnemies: 10,
      combat: {
        enemyMaxHp: 1,
        playerHitDamage: 1, // one-shot
        playerHitCooldownMs: 800,
        enemyHitDamage: 2,
        enemyHitIntervalMs: 1500,
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
      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      infectedCount: 0,
      status: 'playing',
      playerHp: 10,

      currentSpawnInterval: 5,
      movesSinceLastSpawn: 0,
      nextEnemyId: 2,
    }

    const afterKill = resolveFight(state, rules, 'attack')

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
