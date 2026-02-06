import type { GameCell, Terrain } from '../types/game'
import type { Enemy, GridPos, Infected } from './hivefallTypes'

export type CollisionResult =
  | { kind: 'ok' }
  | { kind: 'blocked'; reason: 'terrain' | 'state' | 'entity' }
  | { kind: 'fight'; enemyId: number }
  | { kind: 'hit_infected'; infectedId: number }
  // placeholders for later:
  | { kind: 'pickup'; resourceId?: string }

function samePos(a: GridPos, b: GridPos): boolean {
  return a.row === b.row && a.col === b.col
}

export function isTerrainBlocked(t: Terrain): boolean {
  return t === '^' || t === '#'
}

export function isCellBlockedForMovement(cell: GameCell): boolean {
  if (cell.state === 'blocked') return true
  return isTerrainBlocked(cell.terrain)
}

export function findEnemyAt(enemies: Enemy[], pos: GridPos): Enemy | undefined {
  return enemies.find(e => samePos(e.pos, pos))
}

export function findInfectedAt(infecteds: Infected[], pos: GridPos): Infected | undefined {
  return infecteds.find(i => samePos(i.pos, pos))
}

/**
 * Resolve what happens if the PLAYER tries to enter `to`.
 */
export function resolvePlayerEnterTile(
  grid: GameCell[][],
  enemies: Enemy[],
  infecteds: Infected[],
  to: GridPos
): CollisionResult {
  const cell = grid[to.row]?.[to.col]
  if (!cell) return { kind: 'blocked', reason: 'terrain' }

  if (isCellBlockedForMovement(cell)) return { kind: 'blocked', reason: 'terrain' }

  const inf = findInfectedAt(infecteds, to)
  if (inf) return { kind: 'blocked', reason: 'entity' }

  const enemy = findEnemyAt(enemies, to)
  if (enemy) return { kind: 'fight', enemyId: enemy.id }

  return { kind: 'ok' }
}

/**
 * Resolve what happens if an ENEMY tries to enter `to`.
 */
export function resolveEnemyEnterTile(
  grid: GameCell[][],
  playerPos: GridPos,
  infecteds: Infected[],
  enemyId: number,
  to: GridPos
): CollisionResult {
  const cell = grid[to.row]?.[to.col]
  if (!cell) return { kind: 'blocked', reason: 'terrain' }

  if (isCellBlockedForMovement(cell)) return { kind: 'blocked', reason: 'terrain' }

  if (samePos(to, playerPos)) return { kind: 'fight', enemyId }

  const inf = findInfectedAt(infecteds, to)
  if (inf) return { kind: 'hit_infected', infectedId: inf.id }

  return { kind: 'ok' }
}
