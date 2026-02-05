// game/hivefallTypes.ts
import type { GameCell } from '../types/game'
import type { WeaponId } from './hivefallRules'

export type GridPos = { row: number; col: number }

export type Enemy = {
  id: number
  pos: GridPos
}

export type FightPhase = 'interlude' | 'combat' | 'won'

export type InventoryState = {
  weapons: WeaponId[]
  charges: Partial<Record<WeaponId, number>>
  food: number
}

export type FightState = null | {
  enemyId: number
  enemyHp: number
  enemyMaxHp: number

  phase: FightPhase

  weaponCooldownMsRemaining: Partial<Record<WeaponId, number>>
  enemyStunMsRemaining: number
  enemyHitMsUntilNext: number

  drops: string[]
}

export type GameStatus = 'playing' | 'won' | 'lost'

export type HivefallState = {
  grid: GameCell[][]
  playerPos: GridPos
  enemies: Enemy[]
  moveCount: number
  infectedCount: number
  status: GameStatus
  playerHp: number

  inventory: InventoryState
  fight: FightState

  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
}
