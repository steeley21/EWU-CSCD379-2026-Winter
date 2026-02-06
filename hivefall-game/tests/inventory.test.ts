// tests/inventory.test.ts
import { describe, it, expect } from 'vitest'
import { mergeHivefallRules } from '../game/hivefallRules'
import { createInitialState, grantWeapon } from '../game/engine'
import type { HivefallState } from '../game/hivefallTypes'

describe('inventory', () => {
  it('starts with Hit only', () => {
    const rules = mergeHivefallRules()
    const s = createInitialState(rules)

    expect(s.inventory.weapons).toEqual(['hit'])
    expect(s.inventory.charges).toEqual({})
    expect(s.inventory.food).toBe(0)
  })

  it('grantWeapon adds a non-consumable weapon once (no duplicates)', () => {
    const rules = mergeHivefallRules()
    const s0 = createInitialState(rules)

    const s1 = grantWeapon(s0, rules, 'sword')
    expect(s1.inventory.weapons).toEqual(['hit', 'sword'])

    const s2 = grantWeapon(s1, rules, 'sword')
    expect(s2).toBe(s1)
  })

  it('grantWeapon adds +1 charge for consumables each time', () => {
    const rules = mergeHivefallRules()
    const s0 = createInitialState(rules)

    const s1 = grantWeapon(s0, rules, 'grenade')
    expect(s1.inventory.weapons).toEqual(['hit', 'grenade'])
    expect(s1.inventory.charges.grenade).toBe(1)

    const s2 = grantWeapon(s1, rules, 'grenade')
    expect(s2.inventory.charges.grenade).toBe(2)
  })

  it('grantWeapon during combat initializes cooldown entry immediately', () => {
    const rules = mergeHivefallRules()
    const s0 = createInitialState(rules)

    const sCombat: HivefallState = {
      ...s0,
      fight: {
        enemyId: 1,
        enemyHp: 5,
        enemyMaxHp: 5,
        phase: 'combat',
        wonChoice: null,

        weaponCooldownMsRemaining: { hit: 0 },
        enemyStunMsRemaining: 0,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
        drops: [],
      },
    }

    const s1 = grantWeapon(sCombat, rules, 'handgun')

    expect(s1.inventory.weapons).toContain('handgun')
    expect(s1.fight?.weaponCooldownMsRemaining.handgun).toBe(0)
  })
})
