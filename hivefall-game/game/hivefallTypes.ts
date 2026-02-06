// game/hivefallTypes.ts
import type { GameCell } from '../types/game'
import type { WeaponId } from './hivefallRules'

export type GridPos = { row: number; col: number }

export type Enemy = {
  id: number
  pos: GridPos
  hp: number
  maxHp: number
}

export type Infected = {
  id: number
  pos: GridPos
}

export type FightPhase = 'interlude' | 'combat' | 'won'
export type WonChoice = 'harvest' | 'acquire'

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

  // Drops/rewards shown on the won screen (after player chooses Harvest/Acquire)
  drops: string[]

  // Player must choose one before Continue is enabled
  wonChoice: WonChoice | null
}

export type GameStatus = 'playing' | 'won' | 'lost'

export type HivefallState = {
  grid: GameCell[][]
  playerPos: GridPos

  enemies: Enemy[]
  infecteds: Infected[]

  moveCount: number

  // Total infected acquired over the run (HUD stat)
  infectedCount: number

  status: GameStatus
  playerHp: number

  inventory: InventoryState
  fight: FightState

  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
  nextInfectedId: number
}
