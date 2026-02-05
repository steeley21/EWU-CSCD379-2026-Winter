// hivefall-game/tests/enemyAI.tests.ts
import { describe, it, expect } from 'vitest'
import { nextEnemyStepToward } from '../game/enemyAi'
import type { GridPos } from '../game/hivefallTypes'

function blockedNone(): (p: GridPos) => boolean {
  return () => false
}

describe('nextEnemyStepToward', () => {
  it('moves one step toward the player', () => {
    const enemy: GridPos = { row: 0, col: 0 }
    const player: GridPos = { row: 0, col: 3 }

    const next = nextEnemyStepToward(enemy, player, 10, 10, blockedNone())
    expect(next).toEqual({ row: 0, col: 1 })
  })

  it('prefers the axis with larger distance', () => {
    const enemy: GridPos = { row: 0, col: 0 }
    const player: GridPos = { row: 5, col: 1 } // row distance bigger

    const next = nextEnemyStepToward(enemy, player, 10, 10, blockedNone())
    expect(next).toEqual({ row: 1, col: 0 })
  })

  it('avoids blocked tiles and tries the other axis', () => {
    const enemy: GridPos = { row: 0, col: 0 }
    const player: GridPos = { row: 0, col: 3 }

    const isBlocked = (p: GridPos) => p.row === 0 && p.col === 1 // block the ideal move
    const next = nextEnemyStepToward(enemy, player, 10, 10, isBlocked)

    // should try the other candidate (row move) but row move is 0 distance here => no move possible
    // so it stays in place in this exact scenario
    expect(next).toEqual({ row: 0, col: 0 })
  })
})
