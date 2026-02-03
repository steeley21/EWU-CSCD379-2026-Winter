// game/combat.ts

import type { HivefallRules } from './hivefallRules'
import type { HivefallState } from './hivefallTypes'

function cloneGrid(grid: HivefallState['grid']): HivefallState['grid'] {
  return grid.map(row => row.map(cell => ({ ...cell })))
}

function setEntity(
  g: HivefallState['grid'],
  p: { row: number; col: number },
  entity: HivefallState['grid'][number][number]['entity']
): void {
  g[p.row][p.col] = { ...g[p.row][p.col], entity }
}

export function startFight(state: HivefallState, rules: HivefallRules, enemyId: number): HivefallState {
  if (state.status !== 'playing') return state
  if (state.fight) return state

  const max = rules.combat.enemyMaxHp
  return {
    ...state,
    fight: { enemyId, enemyHp: max, enemyMaxHp: max },
  }
}

export function runFromFight(state: HivefallState): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state
  return { ...state, fight: null }
}

export function playerHit(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state

  const dmg = rules.combat.playerHitDamage
  const nextHp = state.fight.enemyHp - dmg

  // enemy still alive
  if (nextHp > 0) {
    return {
      ...state,
      fight: { ...state.fight, enemyHp: nextHp },
    }
  }

  // enemy dies => infect + remove enemy + clear fight
  const enemyId = state.fight.enemyId
  const enemy = state.enemies.find(e => e.id === enemyId)
  if (!enemy) {
    return { ...state, fight: null }
  }

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

export function enemyHitTick(state: HivefallState, rules: HivefallRules): HivefallState {
  if (state.status !== 'playing') return state
  if (!state.fight) return state

  const dmg = rules.combat.enemyHitDamage
  const nextHp = state.playerHp - dmg

  if (nextHp <= 0) {
    return { ...state, playerHp: 0, status: 'lost', fight: null }
  }

  return { ...state, playerHp: nextHp }
}
