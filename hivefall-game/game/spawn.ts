// game/spawn.ts
import type { GridPos } from './hivefallTypes'

function randInt(maxExclusive: number, rng: () => number): number {
  return Math.floor(rng() * maxExclusive)
}

export function isOnBoard(pos: GridPos, rows: number, cols: number): boolean {
  return pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols
}

/**
 * Picks a random position on the edge of the map.
 * rng is injectable for deterministic unit tests.
 */
export function pickRandomEdgePos(
  rows: number,
  cols: number,
  rng: () => number = Math.random
): GridPos {
  const edge = Math.floor(rng() * 4)

  if (edge === 0) return { row: 0, col: randInt(cols, rng) }           // top
  if (edge === 1) return { row: rows - 1, col: randInt(cols, rng) }    // bottom
  if (edge === 2) return { row: randInt(rows, rng), col: 0 }           // left
  return { row: randInt(rows, rng), col: cols - 1 }                    // right
}

/**
 * Finds a valid edge spawn position by trying random edge positions up to maxTries.
 * isBlocked should include "occupied by enemy", "is player tile", etc.
 */
export function findEdgeSpawnPos(
  rows: number,
  cols: number,
  isBlocked: (p: GridPos) => boolean,
  rng: () => number = Math.random,
  maxTries = 50
): GridPos | null {
  for (let i = 0; i < maxTries; i++) {
    const pos = pickRandomEdgePos(rows, cols, rng)
    if (!isBlocked(pos)) return pos
  }
  return null
}
