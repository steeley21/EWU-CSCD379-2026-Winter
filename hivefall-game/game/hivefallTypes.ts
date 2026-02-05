// hivefall-game/game/hivefallTypes.ts
import type { GameCell } from '../types/game'

export type GridPos = { row: number; col: number }

export type Enemy = {
  id: number
  pos: GridPos
}

export type FightPhase = 'interlude' | 'combat' | 'won'

export type FightState = null | {
  enemyId: number
  enemyHp: number
  enemyMaxHp: number

  phase: FightPhase

  // timers (tick-based)
  playerHitCooldownMsRemaining: number
  enemyHitMsUntilNext: number

  // placeholder drops for won screen
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
  fight: FightState

  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
}
