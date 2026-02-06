// game/infectedAi.ts
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
 * Returns the next position for an infected ally to move (1 tile max).
 * - Prefers the axis with the larger distance to the target.
 * - Deterministic tie-breaker: prefer row if |dr| === |dc|.
 * - Will not move into blocked tiles (via isBlocked)
 * - Allows moving onto the target tile (handled by caller by NOT marking target as blocked)
 */
export function nextInfectedStepToward(
  infectedPos: GridPos,
  targetPos: GridPos,
  rows: number,
  cols: number,
  isBlocked: (p: GridPos) => boolean
): GridPos {
  const dr = targetPos.row - infectedPos.row
  const dc = targetPos.col - infectedPos.col

  const stepR = sign(dr)
  const stepC = sign(dc)

  const preferRow = Math.abs(dr) >= Math.abs(dc)

  const candidates: GridPos[] = preferRow
    ? [
        { row: infectedPos.row + stepR, col: infectedPos.col },
        { row: infectedPos.row, col: infectedPos.col + stepC },
      ]
    : [
        { row: infectedPos.row, col: infectedPos.col + stepC },
        { row: infectedPos.row + stepR, col: infectedPos.col },
      ]

  for (const p of candidates) {
    if (samePos(p, infectedPos)) continue
    if (!isOnBoard(p, rows, cols)) continue
    if (isBlocked(p)) continue
    return p
  }

  return infectedPos
}
