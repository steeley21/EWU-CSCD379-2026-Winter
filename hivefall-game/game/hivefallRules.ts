// game/hivefallRules.ts
import type { Terrain } from '../types/game'

export type SpawnPacingRules = {
  minInterval: number
  decreaseEverySpawns: number
  step: number
}

export type CombatRules = {
  enemyMaxHp: number

  // (kept for backwards-compatibility / old UI; weapons now own player dmg+cooldown)
  playerHitDamage: number
  playerHitCooldownMs: number

  enemyHitDamage: number
  enemyHitIntervalMs: number

  // NEW: infected ally auto-hit damage (low; can still kill weakened enemies)
  infectedHitDamage: number
}

export type DropRules = {
  /**
   * Chance (0..1) for +1 food drop on enemy defeat
   * NOTE: With Harvest/Acquire, Food is now granted via Harvest (guaranteed).
   * This is kept for compatibility but is not used by the new victory flow.
   */
  foodChance: number

  /**
   * Chance (0..1) for a weapon drop roll on enemy defeat
   */
  weaponChance: number
}

export type WeaponId =
  | 'hit'
  | 'sword'
  | 'handgun'
  | 'laser_rifle'
  | 'grenade'
  | 'stun_grenade'

export type WeaponDef = {
  id: WeaponId
  name: string
  damage: number
  cooldownMs: number

  // optional effects
  consumable?: boolean
  stunMs?: number

  /**
   * Drop weight (relative). Higher => more likely.
   * Use 0 to disable dropping this weapon.
   */
  dropWeight?: number
}

export type HivefallRules = {
  rows: number
  cols: number
  terrain: Terrain

  maxEnemies: number
  firstSpawnAfterMoves: number

  spawnPacing: SpawnPacingRules

  playerMaxHp: number
  combat: CombatRules

  // weapon library (inventory decides what's usable)
  weapons: Record<WeaponId, WeaponDef>

  drops: DropRules
}

export type HivefallRulesOverrides =
  & Partial<Omit<HivefallRules, 'spawnPacing' | 'combat' | 'weapons' | 'drops'>>
  & {
    spawnPacing?: Partial<SpawnPacingRules>
    combat?: Partial<CombatRules>
    drops?: Partial<DropRules>
    weapons?: Partial<Record<WeaponId, Partial<WeaponDef>>>
  }

export const defaultHivefallRules: HivefallRules = {
  rows: 14,
  cols: 24,
  terrain: '.',

  // Increased difficulty: more total enemies in a run
  maxEnemies: 25,

  firstSpawnAfterMoves: 5,

  // Slower pacing:
  // - Never faster than 1 spawn every 3 moves
  // - Only accelerates every 4 spawns
  spawnPacing: {
    minInterval: 3,
    decreaseEverySpawns: 4,
    step: 1,
  },

  playerMaxHp: 20,

  combat: {
    enemyMaxHp: 10,

    // legacy (Hit weapon matches these defaults)
    playerHitDamage: 1,
    playerHitCooldownMs: 800,

    enemyHitDamage: 2,
    enemyHitIntervalMs: 1800,

    infectedHitDamage: 5,
  },

  weapons: {
    hit: {
      id: 'hit',
      name: 'Hit',
      damage: 1,
      cooldownMs: 800,
      dropWeight: 0,
    },
    sword: {
      id: 'sword',
      name: 'Sword',
      damage: 2,
      cooldownMs: 1200,
      dropWeight: 10,
    },
    handgun: {
      id: 'handgun',
      name: 'Handgun',
      damage: 3,
      cooldownMs: 1600,
      dropWeight: 6,
    },
    laser_rifle: {
      id: 'laser_rifle',
      name: 'Laser Rifle',
      damage: 4,
      cooldownMs: 2000,
      dropWeight: 3,
    },
    grenade: {
      id: 'grenade',
      name: 'Grenade',
      damage: 5,
      cooldownMs: 2600,
      consumable: true,
      dropWeight: 4,
    },
    stun_grenade: {
      id: 'stun_grenade',
      name: 'Stun Grenade',
      damage: 1,
      cooldownMs: 3000,
      consumable: true,
      stunMs: 2200,
      dropWeight: 2,
    },
  },

  drops: {
    foodChance: 0.55,
    weaponChance: 0.12,
  },
}

export function mergeHivefallRules(overrides: HivefallRulesOverrides = {}): HivefallRules {
  const merged: HivefallRules = {
    ...defaultHivefallRules,
    ...overrides,

    spawnPacing: {
      ...defaultHivefallRules.spawnPacing,
      ...(overrides.spawnPacing ?? {}),
    },

    combat: {
      ...defaultHivefallRules.combat,
      ...(overrides.combat ?? {}),
    },

    drops: {
      ...defaultHivefallRules.drops,
      ...(overrides.drops ?? {}),
    },

    weapons: { ...defaultHivefallRules.weapons },
  }

  const w = overrides.weapons ?? {}
  for (const id of Object.keys(w) as WeaponId[]) {
    const base = merged.weapons[id]
    const patch = w[id] ?? {}
    merged.weapons[id] = { ...base, ...patch, id }
  }

  return merged
}
