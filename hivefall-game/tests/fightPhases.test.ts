// tests/fightPhases.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { Enemy, HivefallState } from '../game/hivefallTypes'
import { engageFight, resolveFight, tickEnemyHit, endFight, chooseWonOutcome } from '../game/engine'
import { mergeHivefallRules } from '../game/hivefallRules'

describe('fight phases', () => {
  const rules = mergeHivefallRules({
    maxEnemies: 2,
    playerMaxHp: 10,
    combat: {
      enemyMaxHp: 2,
      enemyHitDamage: 2,
      enemyHitIntervalMs: 1500,
      infectedHitDamage: 1,
    },
    weapons: {
      hit: { damage: 1, cooldownMs: 800, name: 'Hit' },
    },
  })

  function baseState(overrides: Partial<HivefallState> = {}): HivefallState {
    const grid = createEmptyGrid(5, 5, '.')
    grid[2][2].entity = 'player'
    grid[1][1].entity = 'enemy'

    const enemies: Enemy[] = [{ id: 1, pos: { row: 1, col: 1 }, hp: 2, maxHp: 2 }]

    const s: HivefallState = {
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
        enemyHp: 2,
        enemyMaxHp: 2,
        phase: 'interlude',
        wonChoice: null,

        weaponCooldownMsRemaining: {},
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },

      currentSpawnInterval: rules.firstSpawnAfterMoves,
      movesSinceLastSpawn: 0,
      nextEnemyId: 3,
      nextInfectedId: 1,

      ...overrides,
    }

    return s
  }

  it('starts in interlude and enemy does not hit before engage', () => {
    const s = baseState()
    const next = tickEnemyHit(s, rules, 9999)
    expect(next).toBe(s)
    expect(next.playerHp).toBe(10)
    expect(next.fight?.phase).toBe('interlude')
  })

  it('engageFight transitions interlude -> combat', () => {
    const s = baseState()
    const next = engageFight(s, rules)

    expect(next.fight?.phase).toBe('combat')
    expect(next.fight?.enemyStunMsRemaining).toBe(0)
    expect(next.fight?.enemyHitMsUntilNext).toBe(rules.combat.enemyHitIntervalMs)
    expect(next.fight?.weaponCooldownMsRemaining.hit).toBe(0)
  })

  it('attack is ignored in interlude', () => {
    const s = baseState()
    const next = resolveFight(s, rules, { kind: 'attack', weaponId: 'hit' })
    expect(next).toBe(s)
  })

  it('killing blow switches to won phase; resolveFight becomes no-op until choice', () => {
    const s = baseState({
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
      enemies: [{ id: 1, pos: { row: 1, col: 1 }, hp: 1, maxHp: 1 }],
    })

    const afterKill = resolveFight(s, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterKill.fight?.phase).toBe('won')
    expect(afterKill.enemies.length).toBe(1) // ✅ still present until Harvest/Acquire

    const afterNoop = resolveFight(afterKill, rules, { kind: 'attack', weaponId: 'hit' })
    expect(afterNoop).toBe(afterKill)

    const afterChoice = chooseWonOutcome(afterKill, rules, 'harvest')
    expect(afterChoice.fight?.wonChoice).toBe('harvest')
    expect(afterChoice.enemies.length).toBe(0)
  })

  it('endFight closes dialog (does not magically apply choice)', () => {
    const s = baseState({
      fight: {
        enemyId: 1,
        enemyHp: 0,
        enemyMaxHp: 1,
        phase: 'won',
        wonChoice: 'harvest',

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
      enemies: [], // already resolved by choice
      nextEnemyId: rules.maxEnemies + 1,
    })

    const next = endFight(s, rules)
    expect(next.fight).toBeNull()
  })
})
