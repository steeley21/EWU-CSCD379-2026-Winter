// game/combat.ts
import type { HivefallRules, WeaponId } from './hivefallRules'
import type { HivefallState } from './hivefallTypes'

function getCharges(state: HivefallState, weaponId: WeaponId): number {
  return state.inventory.charges[weaponId] ?? 0
}

function grantWeaponToInventory(
  inv: HivefallState['inventory'],
  rules: HivefallRules,
  weaponId: WeaponId
): HivefallState['inventory'] {
  const def = rules.weapons[weaponId]
  if (!def) return inv

  const has = inv.weapons.includes(weaponId)
  let nextWeapons = inv.weapons
  let nextCharges = inv.charges

  if (!has) nextWeapons = [...inv.weapons, weaponId]

  if (def.consumable) {
    const cur = inv.charges[weaponId] ?? 0
    nextCharges = { ...inv.charges, [weaponId]: cur + 1 }
  }

  if (nextWeapons === inv.weapons && nextCharges === inv.charges) return inv
  return { ...inv, weapons: nextWeapons, charges: nextCharges }
}

function pickWeaponDrop(rules: HivefallRules, rng: () => number): WeaponId | null {
  const entries = (Object.keys(rules.weapons) as WeaponId[])
    .filter(id => id !== 'hit')
    .map(id => ({ id, w: rules.weapons[id].dropWeight ?? 0 }))
    .filter(x => x.w > 0)

  const total = entries.reduce((sum, e) => sum + e.w, 0)
  if (total <= 0) return null

  const roll = rng() * total
  let acc = 0
  for (const e of entries) {
    acc += e.w
    if (roll < acc) return e.id
  }
  return entries[entries.length - 1]?.id ?? null
}

/**
 * Victory reward roll used by Harvest/Acquire resolution.
 * (Food is now handled by Harvest directly; this only rolls for weapons.)
 */
export function rollWeaponVictoryDrop(
  inv: HivefallState['inventory'],
  rules: HivefallRules,
  rng: () => number
): { nextInv: HivefallState['inventory']; labels: string[] } {
  let nextInv = inv
  const labels: string[] = []

  if ((rules.drops?.weaponChance ?? 0) > 0 && rng() < (rules.drops.weaponChance ?? 0)) {
    const wid = pickWeaponDrop(rules, rng)
    if (wid) {
      nextInv = grantWeaponToInventory(nextInv, rules, wid)
      labels.push(`${rules.weapons[wid].name} (+1)`)
    }
  }

  return { nextInv, labels }
}

export function startFight(state: HivefallState, rules: HivefallRules, enemyId: number): HivefallState {
  if (state.status !== 'playing') return state
  if (state.fight) return state

  const enemy = state.enemies.find(e => e.id === enemyId)
  const max = enemy?.maxHp ?? rules.combat.enemyMaxHp
  const hp = enemy?.hp ?? max

  return {
    ...state,
    fight: {
      enemyId,
      enemyHp: hp,
      enemyMaxHp: max,
      phase: 'interlude',

      weaponCooldownMsRemaining: {},
      enemyStunMsRemaining: 0,
      enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,

      drops: [],
      wonChoice: null,
    },
  }
}

export function engageFight(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  if (state.fight.phase !== 'interlude') return state

  const cd: Partial<Record<WeaponId, number>> = {}
  for (const wid of state.inventory.weapons) cd[wid] = 0

  return {
    ...state,
    fight: {
      ...state.fight,
      phase: 'combat',
      weaponCooldownMsRemaining: cd,
      enemyStunMsRemaining: 0,
      enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
    },
  }
}

export function runFromFight(state: HivefallState): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  return { ...state, fight: null }
}

export function useFood(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight || state.fight.phase !== 'combat') return state

  const food = state.inventory.food ?? 0
  if (food <= 0) return state

  const max = rules.playerMaxHp
  if (state.playerHp >= max) return state

  const nextHp = Math.min(max, state.playerHp + 10)
  return {
    ...state,
    playerHp: nextHp,
    inventory: {
      ...state.inventory,
      food: food - 1,
    },
  }
}

export function playerAttack(
  state: HivefallState,
  rules: HivefallRules,
  weaponId: WeaponId,
  rng: () => number = Math.random
): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  if (state.fight.phase !== 'combat') return state

  if (!state.inventory.weapons.includes(weaponId)) return state

  const def = rules.weapons[weaponId]
  const cooldownRemaining = state.fight.weaponCooldownMsRemaining[weaponId] ?? 0
  if (cooldownRemaining > 0) return state

  if (def.consumable) {
    const charges = getCharges(state, weaponId)
    if (charges <= 0) return state
  }

  const nextEnemyHp = state.fight.enemyHp - def.damage

  const nextCooldowns: Partial<Record<WeaponId, number>> = {
    ...(state.fight.weaponCooldownMsRemaining ?? {}),
    [weaponId]: def.cooldownMs,
  }

  const stunMs = def.stunMs ?? 0
  const nextStun =
    stunMs > 0
      ? Math.max(state.fight.enemyStunMsRemaining ?? 0, stunMs)
      : (state.fight.enemyStunMsRemaining ?? 0)

  let nextCharges = state.inventory.charges
  if (def.consumable) {
    const current = getCharges(state, weaponId)
    nextCharges = { ...nextCharges, [weaponId]: Math.max(0, current - 1) }
  }

  // Persist enemy HP on the enemy instance
  const enemyId = state.fight.enemyId
  const enemiesUpdated = state.enemies.map(e => {
    if (e.id !== enemyId) return e
    return { ...e, hp: Math.max(0, nextEnemyHp) }
  })

  if (nextEnemyHp > 0) {
    return {
      ...state,
      enemies: enemiesUpdated,
      inventory: { ...state.inventory, charges: nextCharges },
      fight: {
        ...state.fight,
        enemyHp: nextEnemyHp,
        weaponCooldownMsRemaining: nextCooldowns,
        enemyStunMsRemaining: nextStun,
      },
    }
  }

  // Enemy defeated: switch to "won" phase.
  // Harvest/Acquire choice will resolve removal + rewards.
  return {
    ...state,
    enemies: enemiesUpdated,
    inventory: { ...state.inventory, charges: nextCharges },
    fight: {
      ...state.fight,
      phase: 'won',
      enemyHp: 0,
      weaponCooldownMsRemaining: nextCooldowns,
      enemyStunMsRemaining: 0,
      enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
      drops: [],
      wonChoice: null,
    },
  }
}

export function applyEnemyHitOnce(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight || state.fight.phase !== 'combat') return state
  if ((state.fight.enemyStunMsRemaining ?? 0) > 0) return state

  const dmg = rules.combat.enemyHitDamage
  const nextHp = state.playerHp - dmg

  if (nextHp <= 0) {
    return { ...state, playerHp: 0, status: 'lost', fight: null }
  }

  return { ...state, playerHp: nextHp }
}
