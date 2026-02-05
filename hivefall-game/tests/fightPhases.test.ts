// hivefall-game/tests/fightPhases.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { engageFight, resolveFight, tickEnemyHit, endFight } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('fight phases', () => {
  const rules = mergeHivefallRules({
    maxEnemies: 2,
    playerMaxHp: 10,
    combat: {
      enemyMaxHp: 2,
      playerHitDamage: 1,
      playerHitCooldownMs: 800,
      enemyHitDamage: 2,
      enemyHitIntervalMs: 1500,
    },
  })

  function baseState(overrides: Partial<HivefallState> = {}): HivefallState {
    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const s: HivefallState = {
      grid,
      playerPos: { row: 2, col: 2 },
      enemies,
      moveCount: 0,
      infectedCount: 0,
      status: 'playing',
      playerHp: 10,
      fight: {
        enemyId: 1,
        enemyHp: 2,
        enemyMaxHp: 2,
        phase: 'interlude',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3, // spawnedTotal = 2 (== maxEnemies) so win can be evaluated later
      ...overrides,
    }

    return s
  }

  it('starts in interlude and enemy does not hit before engage', () => {
    const s = baseState()

    // tick should be ignored outside combat phase
    const next = tickEnemyHit(s, rules, 9999)
    expect(next).toBe(s)
    expect(next.playerHp).toBe(10)
    expect(next.fight?.phase).toBe('interlude')
  })

  it('engageFight transitions interlude -> combat (and resets enemy timer)', () => {
    const s = baseState({
      fight: {
        enemyId: 1,
        enemyHp: 2,
        enemyMaxHp: 2,
        phase: 'interlude',
        playerHitCooldownMsRemaining: 123,
        enemyHitMsUntilNext: 77,
        drops: [],
      },
    })

    const next = engageFight(s, rules)

    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.playerHitCooldownMsRemaining).toBe(0)
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
  })

  it('attack is ignored in interlude', () => {
    const s = baseState()

    const next = resolveFight(s, rules, 'attack')
    expect(next).toBe(s)
    expect(next.fight?.phase).toBe('interlude')
    expect(next.fight?.enemyHp).toBe(2)
  })

  it('after enemy is defeated, phase becomes won and resolveFight becomes a no-op', () => {
    // combat with enemyHp=1 so one hit kills
    const s = baseState({
      fight: {
        enemyId: 1,
        enemyHp: 1,
        enemyMaxHp: 1,
        phase: 'combat',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
    })

    const afterKill = resolveFight(s, rules, 'attack')

    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.fight?.enemyHp).toBe(0)
    expect(afterKill.enemies.length).toBe(0)
    expect(afterKill.infectedCount).toBe(1)
    expect(afterKill.grid[1][1].entity).toBe('infected')

    // resolveFight should do nothing while in 'won'
    const afterNoopAttack = resolveFight(afterKill, rules, 'attack')
    const afterNoopRun = resolveFight(afterKill, rules, 'run')
    expect(afterNoopAttack).toBe(afterKill)
    expect(afterNoopRun).toBe(afterKill)
  })

  it('endFight closes the dialog; if win conditions are met, status becomes won', () => {
    const s = baseState({
      enemies: [], // none alive
      infectedCount: rules.maxEnemies, // all infected
      fight: {
        enemyId: 1,
        enemyHp: 0,
        enemyMaxHp: 2,
        phase: 'won',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: ['???'],
      },
      nextEnemyId: rules.maxEnemies + 1, // spawnedTotal == maxEnemies
    })

    const next = endFight(s, rules)
    expect(next.fight).toBeNull()
    expect(next.status).toBe('won')
  })

  it('endFight closes the dialog; if win conditions are NOT met, status stays playing', () => {
    const s = baseState({
      infectedCount: 0, // not all infected
      enemies: [], // none alive, but still not all infected
      fight: {
        enemyId: 1,
        enemyHp: 0,
        enemyMaxHp: 2,
        phase: 'won',
        playerHitCooldownMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: ['???'],
      },
      nextEnemyId: rules.maxEnemies + 1, // spawnedTotal == maxEnemies
    })

    const next = endFight(s, rules)
    expect(next.fight).toBeNull()
    expect(next.status).toBe('playing')
  })
})
