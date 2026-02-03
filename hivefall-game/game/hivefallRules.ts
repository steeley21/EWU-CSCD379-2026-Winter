// game/hivefallRules.ts
import type { Terrain } from '../types/game'

export type SpawnPacingRules = {
  minInterval: number
  decreaseEverySpawns: number
  step: number
}

export type HivefallRules = {
  rows: number
  cols: number
  terrain: Terrain

  maxEnemies: number
  firstSpawnAfterMoves: number

  spawnPacing: SpawnPacingRules

  playerMaxHp: number
  damagePerFight: number
}

export const defaultHivefallRules: HivefallRules = {
  rows: 14,
  cols: 24,
  terrain: '.',

  maxEnemies: 10,
  firstSpawnAfterMoves: 5,

  spawnPacing: {
    minInterval: 2,
    decreaseEverySpawns: 2,
    step: 1,
  },

  playerMaxHp: 20,
  damagePerFight: 1,
}

export function mergeHivefallRules(overrides: Partial<HivefallRules> = {}): HivefallRules {
  return {
    ...defaultHivefallRules,
    ...overrides,
    spawnPacing: {
      ...defaultHivefallRules.spawnPacing,
      ...(overrides.spawnPacing ?? {}),
    },
  }
}
