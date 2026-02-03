// game/movement.ts
import type { GridPos } from './hivefallTypes'

export type MoveDir = 'up' | 'down' | 'left' | 'right'

export type Delta = { dr: number; dc: number }

export type AttemptMoveResult =
  | { ok: true; to: GridPos }
  | { ok: false; to: GridPos; reason: 'out_of_bounds' | 'blocked' }

/**
 * Direction -> delta.
 */
export function dirDelta(dir: MoveDir): Delta {
  switch (dir) {
    case 'up':
      return { dr: -1, dc: 0 }
    case 'down':
      return { dr: 1, dc: 0 }
    case 'left':
      return { dr: 0, dc: -1 }
    case 'right':
      return { dr: 0, dc: 1 }
  }
}

export function addPos(pos: GridPos, delta: Delta): GridPos {
  return { row: pos.row + delta.dr, col: pos.col + delta.dc }
}

export function inBounds(pos: GridPos, rows: number, cols: number): boolean {
  return pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols
}

/**
 * Pure move attempt:
 * - calculates the destination
 * - enforces bounds
 * - optionally enforces a caller-provided "blocked" rule
 *
 * (Later) your engine can pass terrain rules, entity rules, etc. through isBlocked.
 */
export function attemptMove(
  from: GridPos,
  dir: MoveDir,
  rows: number,
  cols: number,
  isBlocked: (to: GridPos) => boolean = () => false
): AttemptMoveResult {
  const to = addPos(from, dirDelta(dir))

  if (!inBounds(to, rows, cols)) {
    return { ok: false, to, reason: 'out_of_bounds' }
  }

  if (isBlocked(to)) {
    return { ok: false, to, reason: 'blocked' }
  }

  return { ok: true, to }
}
