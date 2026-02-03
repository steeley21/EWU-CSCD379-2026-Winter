// game/hivefallRules.ts
import type { Terrain } from '../types/game'

export type SpawnPacingRules = {
  /**
   * Minimum interval allowed after acceleration.
   * Example: 2 means "spawns at most every 2 moves"
   */
  minInterval: number

  /**
   * Only decrease the interval every N spawns.
   * Example: 2 means interval decreases on spawn #2, #4, #6...
   */
  decreaseEverySpawns: number

  /**
   * How much to decrease when acceleration triggers.
   * Usually 1.
   */
  step: number
}

export type HivefallRules = {
  rows: number
  cols: number
  terrain: Terrain

  maxEnemies: number
  firstSpawnAfterMoves: number

  spawnPacing: SpawnPacingRules
}

export const defaultHivefallRules: HivefallRules = {
  rows: 14,
  cols: 24,
  terrain: '.',

  maxEnemies: 10,
  firstSpawnAfterMoves: 5,

  // ✅ slower ramp by default
  spawnPacing: {
    minInterval: 2,
    decreaseEverySpawns: 2,
    step: 1,
  },
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
