// game/collision.ts
import type { GameCell, Terrain } from '../types/game'
import type { Enemy, GridPos } from './hivefallTypes'

export type CollisionResult =
  | { kind: 'ok' }
  | { kind: 'blocked'; reason: 'terrain' | 'state' | 'entity' }
  | { kind: 'fight'; enemyId: number }
  // placeholders for later:
  | { kind: 'pickup'; resourceId?: string }
  | { kind: 'infect'; enemyId: number }

function samePos(a: GridPos, b: GridPos): boolean {
  return a.row === b.row && a.col === b.col
}

export function isTerrainBlocked(t: Terrain): boolean {
  // Reserved for future: treat these as walls for movement.
  // Right now your world is '.' everywhere, so this changes nothing today.
  return t === '^' || t === '#'
}

export function isCellBlockedForMovement(cell: GameCell): boolean {
  // Leave room for later systems (fog, danger, etc.)
  if (cell.state === 'blocked') return true
  return isTerrainBlocked(cell.terrain)
}

export function findEnemyAt(enemies: Enemy[], pos: GridPos): Enemy | undefined {
  return enemies.find(e => samePos(e.pos, pos))
}

/**
 * Resolve what happens if the PLAYER tries to enter `to`.
 * - terrain/state can block
 * - enemy triggers fight
 * - (later) resources trigger pickup, etc.
 */
export function resolvePlayerEnterTile(
  grid: GameCell[][],
  enemies: Enemy[],
  to: GridPos
): CollisionResult {
  const cell = grid[to.row]?.[to.col]
  if (!cell) return { kind: 'blocked', reason: 'terrain' } // defensive

  if (isCellBlockedForMovement(cell)) return { kind: 'blocked', reason: 'terrain' }

  const enemy = findEnemyAt(enemies, to)
  if (enemy) return { kind: 'fight', enemyId: enemy.id }

  // TODO later:
  // - if resource at to => { kind:'pickup', ... }
  // - if infected rules => { kind:'infect', ... }

  return { kind: 'ok' }
}

/**
 * Resolve what happens if an ENEMY tries to enter `to`.
 * - terrain/state can block
 * - entering player triggers fight
 * - (later) enemies might avoid hazards, etc.
 */
export function resolveEnemyEnterTile(
  grid: GameCell[][],
  playerPos: GridPos,
  enemyId: number,
  to: GridPos
): CollisionResult {
  const cell = grid[to.row]?.[to.col]
  if (!cell) return { kind: 'blocked', reason: 'terrain' }

  if (isCellBlockedForMovement(cell)) return { kind: 'blocked', reason: 'terrain' }

  if (samePos(to, playerPos)) return { kind: 'fight', enemyId }

  return { kind: 'ok' }
}
