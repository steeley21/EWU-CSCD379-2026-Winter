// game/pacing.ts

export type SpawnPacingState = {
  currentInterval: number
  movesSinceLastSpawn: number
}

export type SpawnPacingResult = {
  next: SpawnPacingState
  shouldSpawn: boolean
}

export function advanceSpawnPacing(p: SpawnPacingState): SpawnPacingResult {
  const moves = p.movesSinceLastSpawn + 1

  if (moves >= p.currentInterval) {
    return {
      shouldSpawn: true,
      next: {
        currentInterval: p.currentInterval,
        movesSinceLastSpawn: 0,
      },
    }
  }

  return {
    shouldSpawn: false,
    next: {
      currentInterval: p.currentInterval,
      movesSinceLastSpawn: moves,
    },
  }
}

export type AccelerateOptions = {
  minInterval?: number
  decreaseEverySpawns?: number
  step?: number
}

/**
 * After a spawn succeeds, optionally reduce interval (accelerate spawning).
 * Slowing knobs:
 * - decreaseEverySpawns: only decrease every N spawns (ex: 2)
 * - minInterval: cap how fast it can get (ex: 2 means "spawn at most every 2 moves")
 */
export function accelerateAfterSpawn(
  currentInterval: number,
  spawnedTotal: number,
  opts: AccelerateOptions = {}
): number {
  const minInterval = opts.minInterval ?? 1
  const every = opts.decreaseEverySpawns ?? 1
  const step = opts.step ?? 1

  if (every <= 1) return Math.max(minInterval, currentInterval - step)

  if (spawnedTotal % every !== 0) return currentInterval

  return Math.max(minInterval, currentInterval - step)
}
