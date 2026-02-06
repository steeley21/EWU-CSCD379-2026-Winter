// tests/enemyAI.tests.ts
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
    const player: GridPos = { row: 5, col: 1 }

    const next = nextEnemyStepToward(enemy, player, 10, 10, blockedNone())
    expect(next).toEqual({ row: 1, col: 0 })
  })

  it('avoids blocked tiles and tries the other axis', () => {
    const enemy: GridPos = { row: 0, col: 0 }
    const player: GridPos = { row: 0, col: 3 }

    const isBlocked = (p: GridPos) => p.row === 0 && p.col === 1
    const next = nextEnemyStepToward(enemy, player, 10, 10, isBlocked)

    expect(next).toEqual({ row: 0, col: 0 })
  })
})
