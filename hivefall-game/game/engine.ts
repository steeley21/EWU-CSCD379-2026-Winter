// hivefall-game/game/engine.ts
import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { HivefallRules } from './hivefallRules'
import type { Enemy, GridPos, HivefallState } from './hivefallTypes'
import {
  startFight,
  engageFight as engageFightCombat,
  playerHit,
  runFromFight,
  applyEnemyHitOnce,
} from './combat'
import { findEdgeSpawnPos } from './spawn'
import { nextEnemyStepToward } from './enemyAi'
import { advanceSpawnPacing, accelerateAfterSpawn } from './pacing'

import { attemptMove } from './movement'
import type { MoveDir } from './movement'
export type { MoveDir } from './movement'

import { resolveEnemyEnterTile, resolvePlayerEnterTile } from './collision'

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

    status: 'playing',
    playerHp: rules.playerMaxHp,

    currentSpawnInterval: rules.firstSpawnAfterMoves,
    movesSinceLastSpawn: 0,
    nextEnemyId: 1,
  }
}

export function step(
  state: HivefallState,
  rules: HivefallRules,
  dir: MoveDir,
  opts: StepOptions = {}
): HivefallState {
  if (state.status !== 'playing') return state

  // Any active fight (interlude/combat/won) freezes world progression.
  if (state.fight) return state

  const move = attemptMove(state.playerPos, dir, rules.rows, rules.cols)
  if (!move.ok) return state

  const to = move.to

  const playerCollision = resolvePlayerEnterTile(state.grid, state.enemies, to)

  if (playerCollision.kind === 'blocked') return state

  if (playerCollision.kind === 'fight') {
    return startFightEvaluated(state, rules, playerCollision.enemyId)
  }

  let g = cloneGrid(state.grid)
  setEntity(g, state.playerPos, null)
  setEntity(g, to, 'player')

  let nextState: HivefallState = {
    ...state,
    grid: g,
    playerPos: to,
    moveCount: state.moveCount + 1,
  }

  ;(() => {
    if (nextState.enemies.length === 0) return

    let grid2 = cloneGrid(nextState.grid)
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

      const enemyCollision = resolveEnemyEnterTile(grid2, nextState.playerPos, e.id, proposed)

      if (enemyCollision.kind === 'fight') {
        const fightState = startFightEvaluated(nextState, rules, e.id)

        updated.push(e)
        for (let j = i + 1; j < nextState.enemies.length; j++) updated.push(nextState.enemies[j])

        nextState = { ...fightState, enemies: updated, grid: grid2 }
        return
      }

      if (enemyCollision.kind === 'blocked') {
        updated.push(e)
        continue
      }

      if (samePos(proposed, e.pos)) {
        updated.push(e)
        continue
      }

      occupied.delete(`${e.pos.row},${e.pos.col}`)
      occupied.add(`${proposed.row},${proposed.col}`)

      setEntity(grid2, e.pos, null)
      setEntity(grid2, proposed, 'enemy')

      updated.push({ ...e, pos: proposed })
    }

    nextState = { ...nextState, enemies: updated, grid: grid2 }
  })()

  // If fight triggered during enemy movement, do not advance pacing/spawn.
  if (nextState.fight) return nextState

  const pacing = advanceSpawnPacing({
    currentInterval: nextState.currentSpawnInterval,
    movesSinceLastSpawn: nextState.movesSinceLastSpawn,
  })

  let movesSince = pacing.next.movesSinceLastSpawn
  let interval = pacing.next.currentInterval
  let enemies = nextState.enemies
  let grid3 = nextState.grid
  let nextEnemyId = nextState.nextEnemyId

  const spawnedTotalBeforeThisTurn = nextEnemyId - 1
  if (pacing.shouldSpawn && spawnedTotalBeforeThisTurn < rules.maxEnemies) {
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
      const spawnedTotalAfterThisSpawn = nextEnemyId - 1

      interval = accelerateAfterSpawn(interval, spawnedTotalAfterThisSpawn, {
        minInterval: rules.spawnPacing.minInterval,
        decreaseEverySpawns: rules.spawnPacing.decreaseEverySpawns,
        step: rules.spawnPacing.step,
      })
    }
  }

  return evaluateEndState(
    {
      ...nextState,
      enemies,
      grid: grid3,
      movesSinceLastSpawn: movesSince,
      currentSpawnInterval: interval,
      nextEnemyId,
    },
    rules
  )
}

function startFightEvaluated(state: HivefallState, rules: HivefallRules, enemyId: number): HivefallState {
  return evaluateEndState(startFight(state, rules, enemyId), rules)
}

function evaluateEndState(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state

  if (state.playerHp <= 0) return { ...state, status: 'lost' }

  const spawnedTotal = state.nextEnemyId - 1
  const hasSpawnedAll = spawnedTotal >= rules.maxEnemies
  const allInfected = state.infectedCount >= rules.maxEnemies
  const noLiveEnemies = state.enemies.length === 0

  // NOTE: still requires fight to be cleared (so Continue matters)
  if (!state.fight && hasSpawnedAll && allInfected && noLiveEnemies) {
    return { ...state, status: 'won' }
  }

  return state
}

export type FightAction = 'attack' | 'run'

export function resolveFight(
  state: HivefallState,
  rules: HivefallRules,
  action: FightAction
): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state

  // Once we're in "won", only Continue should close it (endFight()).
  if (state.fight.phase === 'won') return state

  if (action === 'run') {
    return evaluateEndState(runFromFight(state), rules)
  }

  // Attack is only valid once you've engaged (combat)
  if (state.fight.phase !== 'combat') return state

  return evaluateEndState(playerHit(state, rules), rules)
}

// interlude -> combat (enemy starts attacking only after this)
export function engageFight(state: HivefallState, rules: HivefallRules): HivefallState {
  return evaluateEndState(engageFightCombat(state, rules), rules)
}

// used when the dialog closes ("Continue") to allow win evaluation immediately
export function endFight(state: HivefallState, rules: HivefallRules): HivefallState {
  if (!state.fight) return state
  return evaluateEndState({ ...state, fight: null }, rules)
}

export function giveUp(state: HivefallState): HivefallState {
  if (state.status !== 'playing') return state
  return { ...state, status: 'lost', fight: null }
}

// Force-clear without evaluating win (generally use endFight() for Continue)
export function clearFight(state: HivefallState): HivefallState {
  if (!state.fight) return state
  return { ...state, fight: null }
}

// Tick-based fight loop (cooldowns + enemy hits). Only runs during combat phase.
export function tickEnemyHit(state: HivefallState, rules: HivefallRules, tickMs: number): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  if (state.fight.phase !== 'combat') return state

  const dt = Math.max(0, tickMs)

  // decrement timers
  const nextCooldown = Math.max(0, (state.fight.playerHitCooldownMsRemaining ?? 0) - dt)
  let nextUntil = (state.fight.enemyHitMsUntilNext ?? rules.combat.enemyHitIntervalMs) - dt

  let next: HivefallState = {
    ...state,
    fight: {
      ...state.fight,
      playerHitCooldownMsRemaining: nextCooldown,
      enemyHitMsUntilNext: nextUntil,
    },
  }

  // apply enemy hits if the timer elapsed (support catch-up if dt is large)
  while (next.fight && next.fight.phase === 'combat' && next.fight.enemyHitMsUntilNext <= 0) {
    next = applyEnemyHitOnce(next, rules)
    if (!next.fight || next.fight.phase !== 'combat') break

    nextUntil = next.fight.enemyHitMsUntilNext + rules.combat.enemyHitIntervalMs
    next = {
      ...next,
      fight: {
        ...next.fight,
        enemyHitMsUntilNext: nextUntil,
      },
    }
  }

  return evaluateEndState(next, rules)
}
