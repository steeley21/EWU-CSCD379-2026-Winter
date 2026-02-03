// game/engine.ts
import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { HivefallRules } from './hivefallRules'
import type { Enemy, FightState, GridPos } from './hivefallTypes'
import { findEdgeSpawnPos } from './spawn'
import { nextEnemyStepToward } from './enemyAi'
import { advanceSpawnPacing, accelerateAfterSpawn } from './pacing'


export type HivefallState = {
  grid: GameCell[][]
  playerPos: GridPos
  enemies: Enemy[]
  moveCount: number
  fight: FightState

  // spawn pacing
  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
}

export type MoveDir = 'up' | 'down' | 'left' | 'right'

export type StepOptions = {
  rng?: () => number
}

function cloneGrid(grid: GameCell[][]): GameCell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

function samePos(a: GridPos, b: GridPos): boolean {
  return a.row === b.row && a.col === b.col
}

function centerPos(rows: number, cols: number): GridPos {
  return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) }
}

function dirDelta(dir: MoveDir): { dr: number; dc: number } {
  switch (dir) {
    case 'up': return { dr: -1, dc: 0 }
    case 'down': return { dr: 1, dc: 0 }
    case 'left': return { dr: 0, dc: -1 }
    case 'right': return { dr: 0, dc: 1 }
  }
}

function inBounds(p: GridPos, rows: number, cols: number): boolean {
  return p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols
}

function setEntity(g: GameCell[][], p: GridPos, entity: GameCell['entity']): void {
  g[p.row][p.col] = { ...g[p.row][p.col], entity }
}

function isOccupiedByEnemy(enemies: Enemy[], p: GridPos): Enemy | undefined {
  return enemies.find(e => samePos(e.pos, p))
}

export function createInitialState(rules: HivefallRules): HivefallState {
  const g = createEmptyGrid(rules.rows, rules.cols, rules.terrain)
  const start = centerPos(rules.rows, rules.cols)
  setEntity(g, start, 'player')

  return {
    grid: g,
    playerPos: start,
    enemies: [],
    moveCount: 0,
    fight: null,

    currentSpawnInterval: rules.firstSpawnAfterMoves,
    movesSinceLastSpawn: 0,
    nextEnemyId: 1,
  }
}

/**
 * Applies one "turn" (player move attempt).
 * Notes:
 * - If fight is active, the state does not advance.
 * - A successful move increments moveCount and advances enemies.
 * - Spawn pacing advances on successful moves.
 * - Spawn happens AFTER enemy movement so new enemies "appear on the edge"
 *   and do not immediately move inward on the same turn they spawn.
 */
export function step(
  state: HivefallState,
  rules: HivefallRules,
  dir: MoveDir,
  opts: StepOptions = {}
): HivefallState {
  if (state.fight) return state

  const { dr, dc } = dirDelta(dir)
  const from = state.playerPos
  const to: GridPos = { row: from.row + dr, col: from.col + dc }

  // invalid move: no turn advance
  if (!inBounds(to, rules.rows, rules.cols)) return state

  // moving into enemy triggers fight: no movement, no turn advance
  const enemyOnTo = isOccupiedByEnemy(state.enemies, to)
  if (enemyOnTo) {
    return { ...state, fight: { enemyId: enemyOnTo.id } }
  }

  // --- apply player movement ---
  let g = cloneGrid(state.grid)
  setEntity(g, from, null)
  setEntity(g, to, 'player')

  let nextState: HivefallState = {
    ...state,
    grid: g,
    playerPos: to,
    moveCount: state.moveCount + 1,
  }

  // --- enemies move 1 step (based on updated player position) ---
  ;(() => {
    if (nextState.enemies.length === 0) return

    let grid2 = cloneGrid(nextState.grid)

    // Track occupied positions to prevent stacking.
    // Use string keys to keep it pure & simple.
    const occupied = new Set(nextState.enemies.map(e => `${e.pos.row},${e.pos.col}`))

    const updated: Enemy[] = []

    for (let i = 0; i < nextState.enemies.length; i++) {
      const e = nextState.enemies[i]

      const isBlocked = (p: GridPos) => occupied.has(`${p.row},${p.col}`)

      const proposed = nextEnemyStepToward(e.pos, nextState.playerPos, rules.rows, rules.cols, isBlocked)

      // collision with player triggers fight; stop processing further enemies
      if (samePos(proposed, nextState.playerPos)) {
        nextState = { ...nextState, fight: { enemyId: e.id } }

        // keep current enemy where it was (visual stability)
        updated.push(e)

        // remaining enemies unchanged
        for (let j = i + 1; j < nextState.enemies.length; j++) updated.push(nextState.enemies[j])

        nextState = { ...nextState, enemies: updated, grid: grid2 }
        return
      }

      // no move
      if (samePos(proposed, e.pos)) {
        updated.push(e)
        continue
      }

      // move enemy
      occupied.delete(`${e.pos.row},${e.pos.col}`)
      occupied.add(`${proposed.row},${proposed.col}`)

      setEntity(grid2, e.pos, null)
      setEntity(grid2, proposed, 'enemy')

      updated.push({ ...e, pos: proposed })
    }

    nextState = { ...nextState, enemies: updated, grid: grid2 }
  })()

  // If fight triggered during enemy movement, do not advance spawn pacing
  if (nextState.fight) return nextState

    // --- spawn pacing (successful player moves only) ---
  const pacing = advanceSpawnPacing({
    currentInterval: nextState.currentSpawnInterval,
    movesSinceLastSpawn: nextState.movesSinceLastSpawn,
  })

  let movesSince = pacing.next.movesSinceLastSpawn
  let interval = pacing.next.currentInterval
  let enemies = nextState.enemies
  let grid3 = nextState.grid
  let nextEnemyId = nextState.nextEnemyId

  if (pacing.shouldSpawn && enemies.length < rules.maxEnemies) {
    const rng = opts.rng ?? Math.random

    const pos = findEdgeSpawnPos(
      rules.rows,
      rules.cols,
      (p) => samePos(p, nextState.playerPos) || !!isOccupiedByEnemy(enemies, p),
      rng,
      50
    )

    if (pos) {
      const grid4 = cloneGrid(grid3)
      setEntity(grid4, pos, 'enemy')
      grid3 = grid4

      enemies = [...enemies, { id: nextEnemyId++, pos }]
      interval = accelerateAfterSpawn(interval, 1)
      // movesSince already reset by advanceSpawnPacing() when shouldSpawn = true
    } else {
      // spawn failed: keep interval the same, but counter already reset in our pacing rule
      // that's fine for now; if you want "failed spawn doesn't reset", we can tweak pacing later
    }
  }

  return {
    ...nextState,
    enemies,
    grid: grid3,
    movesSinceLastSpawn: movesSince,
    currentSpawnInterval: interval,
    nextEnemyId,
  }
}

export function clearFight(state: HivefallState): HivefallState {
  if (!state.fight) return state
  return { ...state, fight: null }
}
