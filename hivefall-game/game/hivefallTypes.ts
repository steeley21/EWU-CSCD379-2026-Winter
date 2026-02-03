import type { GameCell } from '../types/game'

// Represents a position on the game grid
export type GridPos = { row: number; col: number }

// Represents an enemy in the game
export type Enemy = {
  id: number
  pos: GridPos
}

// Represents an ongoing fight between the player and an enemy
export type FightState = null | {
  enemyId: number
  enemyHp: number
  enemyMaxHp: number
}

// Possible statuses of the game
export type GameStatus = 'playing' | 'won' | 'lost'

// Represents the overall state of the Hivefall game
export type HivefallState = {
  grid: import('../types/game').GameCell[][]
  playerPos: GridPos
  enemies: Enemy[]
  moveCount: number
  infectedCount: number
  status: GameStatus
  playerHp: number
  fight: FightState

  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
}
