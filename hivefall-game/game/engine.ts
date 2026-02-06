// game/engine.ts

import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { HivefallRules, WeaponId } from './hivefallRules'
import type { Enemy, GridPos, HivefallState, Infected, WonChoice } from './hivefallTypes'
import {
  startFight,
  engageFight as engageFightCombat,
  playerAttack,
  runFromFight,
  applyEnemyHitOnce,
  useFood as useFoodCombat,
  rollWeaponVictoryDrop,
} from './combat'
import { findEdgeSpawnPos } from './spawn'
import { nextEnemyStepToward } from './enemyAi'
import { nextInfectedStepToward } from './infectedAi'
import { advanceSpawnPacing, accelerateAfterSpawn } from './pacing'

import { attemptMove } from './movement'
import type { MoveDir } from './movement'
export type { MoveDir } from './movement'

import {
  resolveEnemyEnterTile,
  resolvePlayerEnterTile,
  isCellBlockedForMovement,
} from './collision'

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

function posKey(p: GridPos): string {
  return `${p.row},${p.col}`
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

function isOccupiedByInfected(infecteds: Infected[], p: GridPos): Infected | undefined {
  return infecteds.find(i => samePos(i.pos, p))
}

function manhattan(a: GridPos, b: GridPos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

/**
 * Nearest-enemy selection:
 * - smallest Manhattan distance
 * - tie-breaker: lowest enemy id (stable/deterministic)
 */
function nearestEnemyFor(infectedPos: GridPos, enemies: Enemy[]): Enemy | null {
  let best: Enemy | null = null
  let bestD = Number.POSITIVE_INFINITY

  for (const e of enemies) {
    const d = manhattan(infectedPos, e.pos)
    if (d < bestD) {
      best = e
      bestD = d
      continue
    }
    if (d === bestD && best && e.id < best.id) {
      best = e
    }
  }

  return best
}

export function createInitialState(rules: HivefallRules): HivefallState {
  const g = createEmptyGrid(rules.rows, rules.cols, rules.terrain)
  const start = centerPos(rules.rows, rules.cols)
  setEntity(g, start, 'player')

  return {
    grid: g,
    playerPos: start,

    enemies: [],
    infecteds: [],

    moveCount: 0,
    fight: null,

    // total acquired over time
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
    nextInfectedId: 1,
  }
}

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
  const playerCollision = resolvePlayerEnterTile(state.grid, state.enemies, state.infecteds, to)

  if (playerCollision.kind === 'blocked') return state
  if (playerCollision.kind === 'fight') return startFightEvaluated(state, rules, playerCollision.enemyId)

  // Move player
  let g = cloneGrid(state.grid)
  setEntity(g, state.playerPos, null)
  setEntity(g, to, 'player')

  let nextState: HivefallState = {
    ...state,
    grid: g,
    playerPos: to,
    moveCount: state.moveCount + 1,
  }

  // Infected move/attack FIRST (allies act before enemies)
  ;(() => {
    if (nextState.infecteds.length === 0) return
    if (nextState.enemies.length === 0) return

    let grid2 = cloneGrid(nextState.grid)
    let enemies2 = [...nextState.enemies]

    const occupied = new Set(nextState.infecteds.map(i => posKey(i.pos)))

    const updatedInfecteds: Infected[] = []

    for (const inf of nextState.infecteds) {
      const target = nearestEnemyFor(inf.pos, enemies2)
      if (!target) {
        updatedInfecteds.push(inf)
        continue
      }

      const enemyPosSet = new Set(enemies2.map(e => posKey(e.pos)))

      const isBlocked = (p: GridPos): boolean => {
        if (samePos(p, nextState.playerPos)) return true
        // allow stepping onto enemy tile (to attack)
        if (enemyPosSet.has(posKey(p))) return false
        if (occupied.has(posKey(p))) return true

        const cell = grid2[p.row]?.[p.col]
        if (!cell) return true
        return isCellBlockedForMovement(cell)
      }

      const proposed = nextInfectedStepToward(inf.pos, target.pos, rules.rows, rules.cols, isBlocked)

      // No move
      if (samePos(proposed, inf.pos)) {
        updatedInfecteds.push(inf)
        continue
      }

      // If stepping onto enemy: damage enemy, infected dies
      if (samePos(proposed, target.pos)) {
        // remove infected from its current tile
        occupied.delete(posKey(inf.pos))
        setEntity(grid2, inf.pos, null)

        const dmg = rules.combat.infectedHitDamage
        const nextHp = target.hp - dmg

        if (nextHp <= 0) {
          // enemy dies
          setEntity(grid2, target.pos, null)
          enemies2 = enemies2.filter(e => e.id !== target.id)
        } else {
          enemies2 = enemies2.map(e => (e.id === target.id ? { ...e, hp: nextHp } : e))
        }

        continue
      }

      // Normal move
      occupied.delete(posKey(inf.pos))
      occupied.add(posKey(proposed))

      setEntity(grid2, inf.pos, null)
      setEntity(grid2, proposed, 'infected')

      updatedInfecteds.push({ ...inf, pos: proposed })
    }

    nextState = { ...nextState, grid: grid2, infecteds: updatedInfecteds, enemies: enemies2 }
  })()

  if (nextState.fight) return nextState

  // Enemies move/attack
  ;(() => {
    if (nextState.enemies.length === 0) return

    let grid2 = cloneGrid(nextState.grid)
    let infecteds2 = [...nextState.infecteds]

    const occupied = new Set(nextState.enemies.map(e => posKey(e.pos)))
    const updated: Enemy[] = []

    for (let i = 0; i < nextState.enemies.length; i++) {
      const e = nextState.enemies[i]
      const isBlockedByEnemy = (p: GridPos) => occupied.has(posKey(p))

      const proposed = nextEnemyStepToward(
        e.pos,
        nextState.playerPos,
        rules.rows,
        rules.cols,
        isBlockedByEnemy
      )

      const enemyCollision = resolveEnemyEnterTile(grid2, nextState.playerPos, infecteds2, e.id, proposed)

      if (enemyCollision.kind === 'fight') {
        const fightState = startFightEvaluated(nextState, rules, e.id)

        updated.push(e)
        for (let j = i + 1; j < nextState.enemies.length; j++) updated.push(nextState.enemies[j])

        nextState = { ...fightState, enemies: updated, grid: grid2, infecteds: infecteds2 }
        return
      }

      if (enemyCollision.kind === 'blocked') {
        updated.push(e)
        continue
      }

      if (enemyCollision.kind === 'hit_infected') {
        // Infected dies, damages enemy, enemy moves into that tile if it survives.
        const inf = infecteds2.find(x => x.id === enemyCollision.infectedId)
        if (inf) {
          infecteds2 = infecteds2.filter(x => x.id !== inf.id)
          setEntity(grid2, inf.pos, null)
        }

        const dmg = rules.combat.infectedHitDamage
        const nextHp = e.hp - dmg

        // enemy dies
        if (nextHp <= 0) {
          occupied.delete(posKey(e.pos))
          setEntity(grid2, e.pos, null)
          continue
        }

        // move enemy into proposed tile (which was infected tile, now cleared)
        occupied.delete(posKey(e.pos))
        occupied.add(posKey(proposed))

        setEntity(grid2, e.pos, null)
        setEntity(grid2, proposed, 'enemy')

        updated.push({ ...e, hp: nextHp, pos: proposed })
        continue
      }

      if (samePos(proposed, e.pos)) {
        updated.push(e)
        continue
      }

      // normal move
      occupied.delete(posKey(e.pos))
      occupied.add(posKey(proposed))

      setEntity(grid2, e.pos, null)
      setEntity(grid2, proposed, 'enemy')

      updated.push({ ...e, pos: proposed })
    }

    nextState = { ...nextState, enemies: updated, grid: grid2, infecteds: infecteds2 }
  })()

  if (nextState.fight) return nextState

  // Spawn pacing + spawn (avoid player/enemy/infected)
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
      (p) =>
        samePos(p, nextState.playerPos) ||
        !!isOccupiedByEnemy(enemies, p) ||
        !!isOccupiedByInfected(nextState.infecteds, p),
      rng,
      50
    )

    if (pos) {
      const grid4 = cloneGrid(grid3)
      setEntity(grid4, pos, 'enemy')
      grid3 = grid4

      enemies = [
        ...enemies,
        {
          id: nextEnemyId++,
          pos,
          hp: rules.combat.enemyMaxHp,
          maxHp: rules.combat.enemyMaxHp,
        },
      ]

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

/**
 * Win condition (new):
 * - Once all enemies have spawned (total spawned >= maxEnemies)
 * - Win when there are no active enemies remaining (killed OR acquired)
 */
function evaluateEndState(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (state.playerHp <= 0) return { ...state, status: 'lost' }

  const spawnedTotal = state.nextEnemyId - 1
  const hasSpawnedAll = spawnedTotal >= rules.maxEnemies
  const noLiveEnemies = state.enemies.length === 0

  if (!state.fight && hasSpawnedAll && noLiveEnemies) {
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

  // won phase is handled by chooseWonOutcome + endFight
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

/**
 * Resolve the mandatory "won" choice.
 * - Harvest: removes enemy, grants Food +1
 * - Acquire: removes enemy, creates an infected ally on that tile, increments total infected
 * - Also rolls weapon victory drop (both choices)
 */
export function chooseWonOutcome(
  state: HivefallState,
  rules: HivefallRules,
  choice: WonChoice,
  opts: { rng?: () => number } = {}
): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight || state.fight.phase !== 'won') return state
  if (state.fight.wonChoice != null) return state

  const enemyId = state.fight.enemyId
  const enemy = state.enemies.find(e => e.id === enemyId)
  if (!enemy) return state

  const rng = opts.rng ?? Math.random

  // Remove defeated enemy from active enemies
  const nextEnemies = state.enemies.filter(e => e.id !== enemyId)

  let grid2 = cloneGrid(state.grid)
  setEntity(grid2, enemy.pos, null)

  let nextInfecteds = state.infecteds
  let nextInfectedCount = state.infectedCount
  let nextInfectedId = state.nextInfectedId

  const dropLabels: string[] = []

  if (choice === 'harvest') {
    // Food +1 guaranteed
    const nextFood = (state.inventory.food ?? 0) + 1
    dropLabels.push('Food (+1)')

    const rolled = rollWeaponVictoryDrop(state.inventory, rules, rng)
    const nextInv = { ...rolled.nextInv, food: nextFood }

    return {
      ...state,
      enemies: nextEnemies,
      grid: grid2,
      inventory: nextInv,
      fight: {
        ...state.fight,
        wonChoice: 'harvest',
        drops: [...dropLabels, ...rolled.labels],
      },
    }
  }

  // Acquire
  // No stacking: if the tile somehow already has an infected, fail safe (no-op).
  if (isOccupiedByInfected(state.infecteds, enemy.pos)) return state

  setEntity(grid2, enemy.pos, 'infected')
  nextInfecteds = [...state.infecteds, { id: nextInfectedId++, pos: enemy.pos }]
  nextInfectedCount = state.infectedCount + 1
  nextInfectedId = nextInfectedId

  const rolled = rollWeaponVictoryDrop(state.inventory, rules, rng)

  return {
    ...state,
    enemies: nextEnemies,
    infecteds: nextInfecteds,
    infectedCount: nextInfectedCount,
    nextInfectedId,
    grid: grid2,
    inventory: rolled.nextInv,
    fight: {
      ...state.fight,
      wonChoice: 'acquire',
      drops: rolled.labels,
    },
  }
}
