// game/hivefallRules.ts
import type { Terrain } from '../types/game'

export type HivefallRules = {
  rows: number
  cols: number
  terrain: Terrain

  maxEnemies: number
  firstSpawnAfterMoves: number
}

export const defaultHivefallRules: HivefallRules = {
  rows: 14,
  cols: 24,
  terrain: '.',
  maxEnemies: 10,
  firstSpawnAfterMoves: 5,
}

export function mergeHivefallRules(overrides: Partial<HivefallRules> = {}): HivefallRules {
  return { ...defaultHivefallRules, ...overrides }
}
