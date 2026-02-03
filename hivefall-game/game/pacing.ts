// game/pacing.ts

export type SpawnPacingState = {
  currentInterval: number
  movesSinceLastSpawn: number
}

export type SpawnPacingResult = {
  next: SpawnPacingState
  shouldSpawn: boolean
}

/**
 * Advances spawn pacing by 1 successful player move.
 * - increments movesSinceLastSpawn
 * - if movesSinceLastSpawn >= currentInterval => shouldSpawn = true and counter resets to 0
 */
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

/**
 * After a spawn succeeds, reduce interval (accelerate spawning).
 * Example: 5 -> 4 -> 3 -> 2 -> 1 -> 1...
 */
export function accelerateAfterSpawn(currentInterval: number, minInterval = 1): number {
  return Math.max(minInterval, currentInterval - 1)
}
