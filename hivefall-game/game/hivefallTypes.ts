// game/hivefallTypes.ts
export type GridPos = { row: number; col: number }

export type Enemy = {
  id: number
  pos: GridPos
}

export type FightState = null | { enemyId: number }
