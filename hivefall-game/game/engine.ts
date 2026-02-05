// game/engine.ts
import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { HivefallRules, WeaponId } from './hivefallRules'
import type { Enemy, GridPos, HivefallState } from './hivefallTypes'
import {
  startFight,
  engageFight as engageFightCombat,
  playerAttack,
  runFromFight,
  applyEnemyHitOnce,
  useFood as useFoodCombat,
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

export type ResolveFightOptions = {
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

    inventory: {
      weapons: ['hit'],
      charges: {},
      food: 0,
    },

    currentSpawnInterval: rules.firstSpawnAfterMoves,
    movesSinceLastSpawn: 0,
    nextEnemyId: 1,
  }
}

/**
 * Grant a weapon to the player (used by debug UI now; later by drops).
 * - Non-consumables: add to weapons list if missing.
 * - Consumables: ensure weapon is listed, and increment charges by +1 each grant.
 * - If granted during an active combat fight, initialize cooldown entry so UI can show it immediately.
 */
export function grantWeapon(
  state: HivefallState,
  rules: HivefallRules,
  weaponId: WeaponId
): HivefallState {
  if (!rules.weapons[weaponId]) return state

  const def = rules.weapons[weaponId]
  const inv = state.inventory

  const alreadyHas = inv.weapons.includes(weaponId)

  let nextWeapons = inv.weapons
  let nextCharges = inv.charges
  let changed = false

  if (!alreadyHas) {
    nextWeapons = [...inv.weapons, weaponId]
    changed = true
  }

  if (def.consumable) {
    const cur = inv.charges[weaponId] ?? 0
    nextCharges = { ...inv.charges, [weaponId]: cur + 1 }
    changed = true
  }

  if (!changed) return state

  let next: HivefallState = {
    ...state,
    inventory: {
      ...inv,
      weapons: nextWeapons,
      charges: nextCharges,
    },
  }

  if (next.fight && next.fight.phase === 'combat') {
    const cds = next.fight.weaponCooldownMsRemaining ?? {}
    if (cds[weaponId] == null) {
      next = {
        ...next,
        fight: {
          ...next.fight,
          weaponCooldownMsRemaining: { ...cds, [weaponId]: 0 },
        },
      }
    }
  }

  return next
}

export function step(
  state: HivefallState,
  rules: HivefallRules,
  dir: MoveDir,
  opts: StepOptions = {}
): HivefallState {
  if (state.status !== 'playing') return state
  if (state.fight) return state

  const move = attemptMove(state.playerPos, dir, rules.rows, rules.cols)
  if (!move.ok) return state

  const to = move.to
  const playerCollision = resolvePlayerEnterTile(state.grid, state.enemies, to)

  if (playerCollision.kind === 'blocked') return state
  if (playerCollision.kind === 'fight') return startFightEvaluated(state, rules, playerCollision.enemyId)

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

  if (!state.fight && hasSpawnedAll && allInfected && noLiveEnemies) {
    return { ...state, status: 'won' }
  }

  return state
}

export type FightAction =
  | { kind: 'run' }
  | { kind: 'attack'; weaponId: WeaponId }
  | { kind: 'use_food' }

export function resolveFight(
  state: HivefallState,
  rules: HivefallRules,
  action: FightAction,
  opts: ResolveFightOptions = {}
): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state

  if (state.fight.phase === 'won') return state

  if (action.kind === 'run') {
    return evaluateEndState(runFromFight(state), rules)
  }

  if (state.fight.phase !== 'combat') return state

  if (action.kind === 'use_food') {
    return evaluateEndState(useFoodCombat(state, rules), rules)
  }

  const rng = opts.rng ?? Math.random
  return evaluateEndState(playerAttack(state, rules, action.weaponId, rng), rules)
}

export function engageFight(state: HivefallState, rules: HivefallRules): HivefallState {
  return evaluateEndState(engageFightCombat(state, rules), rules)
}

export function endFight(state: HivefallState, rules: HivefallRules): HivefallState {
  if (!state.fight) return state
  return evaluateEndState({ ...state, fight: null }, rules)
}

export function giveUp(state: HivefallState): HivefallState {
  if (state.status !== 'playing') return state
  return { ...state, status: 'lost', fight: null }
}

export function clearFight(state: HivefallState): HivefallState {
  if (!state.fight) return state
  return { ...state, fight: null }
}

function decWeaponCooldowns(
  cooldowns: Partial<Record<WeaponId, number>>,
  dt: number
): Partial<Record<WeaponId, number>> {
  const next: Partial<Record<WeaponId, number>> = { ...(cooldowns ?? {}) }
  for (const k of Object.keys(next) as WeaponId[]) {
    next[k] = Math.max(0, (next[k] ?? 0) - dt)
  }
  return next
}

export function tickEnemyHit(state: HivefallState, rules: HivefallRules, tickMs: number): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  if (state.fight.phase !== 'combat') return state

  const dt = Math.max(0, tickMs)

  const nextCooldowns = decWeaponCooldowns(state.fight.weaponCooldownMsRemaining ?? {}, dt)

  const stunBefore = state.fight.enemyStunMsRemaining ?? 0
  const stunAfter = Math.max(0, stunBefore - dt)

  if (stunAfter > 0) {
    const nextStunned: HivefallState = {
      ...state,
      fight: {
        ...state.fight,
        weaponCooldownMsRemaining: nextCooldowns,
        enemyStunMsRemaining: stunAfter,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
      },
    }
    return evaluateEndState(nextStunned, rules)
  }

  let enemyUntil = state.fight.enemyHitMsUntilNext ?? rules.combat.enemyHitIntervalMs
  if (stunBefore > 0 && stunAfter === 0) enemyUntil = rules.combat.enemyHitIntervalMs
  else enemyUntil = enemyUntil - dt

  let next: HivefallState = {
    ...state,
    fight: {
      ...state.fight,
      weaponCooldownMsRemaining: nextCooldowns,
      enemyStunMsRemaining: 0,
      enemyHitMsUntilNext: enemyUntil,
    },
  }

  while (next.fight && next.fight.phase === 'combat' && next.fight.enemyHitMsUntilNext <= 0) {
    next = applyEnemyHitOnce(next, rules)
    if (!next.fight || next.fight.phase !== 'combat') break

    next = {
      ...next,
      fight: {
        ...next.fight,
        enemyHitMsUntilNext: rules.combat.enemyHitIntervalMs,
      },
    }
  }

  return evaluateEndState(next, rules)
}
