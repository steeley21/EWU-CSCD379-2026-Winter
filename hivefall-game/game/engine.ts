// game/engine.ts
import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { HivefallRules } from './hivefallRules'
import type { Enemy, FightState, GridPos } from './hivefallTypes'
import { findEdgeSpawnPos } from './spawn'
import { nextEnemyStepToward } from './enemyAi'
import { advanceSpawnPacing, accelerateAfterSpawn } from './pacing'

import { attemptMove } from './movement'
import type { MoveDir } from './movement'
export type { MoveDir } from './movement'

import { resolveEnemyEnterTile, resolvePlayerEnterTile } from './collision'

export type HivefallState = {
  grid: GameCell[][]
  playerPos: GridPos
  enemies: Enemy[]
  moveCount: number
  fight: FightState

  infectedCount: number 

  // spawn pacing
  currentSpawnInterval: number
  movesSinceLastSpawn: number
  nextEnemyId: number
}


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

    infectedCount: 0, 

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
  // If we're in a fight state, freeze world progression.
  if (state.fight) return state

  // --- player movement (bounds) ---
  const move = attemptMove(state.playerPos, dir, rules.rows, rules.cols)
  if (!move.ok) return state

  const to = move.to

  // --- player collision (terrain/enemy/resources later) ---
  const playerCollision = resolvePlayerEnterTile(state.grid, state.enemies, to)

  if (playerCollision.kind === 'blocked') return state

  if (playerCollision.kind === 'fight') {
    return { ...state, fight: { enemyId: playerCollision.enemyId } }
  }

  // --- apply player move ---
  let g = cloneGrid(state.grid)
  setEntity(g, state.playerPos, null)
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

    // Prevent enemy stacking by tracking occupied cells as we move enemies.
    const occupied = new Set(nextState.enemies.map(e => `${e.pos.row},${e.pos.col}`))

    const updated: Enemy[] = []

    for (let i = 0; i < nextState.enemies.length; i++) {
      const e = nextState.enemies[i]

      const isBlockedByEnemy = (p: GridPos) => occupied.has(`${p.row},${p.col}`)

      const proposed = nextEnemyStepToward(
        e.pos,
        nextState.playerPos,
        rules.rows,
        rules.cols,
        isBlockedByEnemy
      )

      // Collision resolution (terrain + player collision)
      const enemyCollision = resolveEnemyEnterTile(grid2, nextState.playerPos, e.id, proposed)

      if (enemyCollision.kind === 'fight') {
        // Trigger fight and stop processing further enemies (keep board stable).
        nextState = { ...nextState, fight: { enemyId: e.id } }

        updated.push(e)
        for (let j = i + 1; j < nextState.enemies.length; j++) updated.push(nextState.enemies[j])

        nextState = { ...nextState, enemies: updated, grid: grid2 }
        return
      }

      if (enemyCollision.kind === 'blocked') {
        // Treat as no move
        updated.push(e)
        continue
      }

      // No move
      if (samePos(proposed, e.pos)) {
        updated.push(e)
        continue
      }

      // Move enemy
      occupied.delete(`${e.pos.row},${e.pos.col}`)
      occupied.add(`${proposed.row},${proposed.col}`)

      setEntity(grid2, e.pos, null)
      setEntity(grid2, proposed, 'enemy')

      updated.push({ ...e, pos: proposed })
    }

    nextState = { ...nextState, enemies: updated, grid: grid2 }
  })()

  // If fight triggered during enemy movement, do not advance spawn pacing/spawn.
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
      (p) =>
        samePos(p, nextState.playerPos) ||
        !!isOccupiedByEnemy(enemies, p),
      rng,
      50
    )


    if (pos) {
      const grid4 = cloneGrid(grid3)
      setEntity(grid4, pos, 'enemy')
      grid3 = grid4

      enemies = [...enemies, { id: nextEnemyId++, pos }]
      const spawnedTotal = nextEnemyId - 1

      interval = accelerateAfterSpawn(interval, spawnedTotal, {
        minInterval: rules.spawnPacing.minInterval,
        decreaseEverySpawns: rules.spawnPacing.decreaseEverySpawns,
        step: rules.spawnPacing.step
      })

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

export type FightAction = 'attack' | 'run'

export function resolveFight(
  state: HivefallState,
  action: FightAction
): HivefallState {
  if (!state.fight) return state

  // "Run" for now just dismisses the fight state.
  if (action === 'run') return clearFight(state)

  // Attack = convert this enemy to infected, remove it from active enemies
  const enemyId = state.fight.enemyId
  const enemy = state.enemies.find(e => e.id === enemyId)
  if (!enemy) return clearFight(state)

  const g = cloneGrid(state.grid)
  setEntity(g, enemy.pos, 'infected')

  return {
    ...state,
    grid: g,
    enemies: state.enemies.filter(e => e.id !== enemyId),
    infectedCount: state.infectedCount + 1,
    fight: null,
  }
}

export function clearFight(state: HivefallState): HivefallState {
  if (!state.fight) return state
  return { ...state, fight: null }
}
