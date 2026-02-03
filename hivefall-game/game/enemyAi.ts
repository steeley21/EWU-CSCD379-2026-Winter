// game/enemyAi.ts
import type { GridPos } from './hivefallTypes'

function samePos(a: GridPos, b: GridPos): boolean {
  return a.row === b.row && a.col === b.col
}

function sign(n: number): number {
  if (n > 0) return 1
  if (n < 0) return -1
  return 0
}

function isOnBoard(p: GridPos, rows: number, cols: number): boolean {
  return p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols
}

/**
 * Returns the next position for an enemy to move (1 tile max).
 * - Prefers the axis with the larger distance to the player.
 * - Will not move into blocked/occupied tiles (via isBlocked)
 * - Allows moving onto the player tile (collision/fight trigger)
 */
export function nextEnemyStepToward(
  enemyPos: GridPos,
  playerPos: GridPos,
  rows: number,
  cols: number,
  isBlocked: (p: GridPos) => boolean
): GridPos {
  const dr = playerPos.row - enemyPos.row
  const dc = playerPos.col - enemyPos.col

  const stepR = sign(dr)
  const stepC = sign(dc)

  const preferRow = Math.abs(dr) >= Math.abs(dc)

  const candidates: GridPos[] = preferRow
    ? [
        { row: enemyPos.row + stepR, col: enemyPos.col },
        { row: enemyPos.row, col: enemyPos.col + stepC },
      ]
    : [
        { row: enemyPos.row, col: enemyPos.col + stepC },
        { row: enemyPos.row + stepR, col: enemyPos.col },
      ]

  for (const p of candidates) {
    // ignore "no move" candidate if step is 0 on that axis
    if (samePos(p, enemyPos)) continue
    if (!isOnBoard(p, rows, cols)) continue

    // allow stepping onto the player (fight trigger)
    if (samePos(p, playerPos)) return p

    if (isBlocked(p)) continue
    return p
  }

  return enemyPos
}
