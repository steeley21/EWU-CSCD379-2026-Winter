// tests/collision.test.ts
import { describe, it, expect } from 'vitest'
import { createEmptyGrid } from '../types/game'
import type { GameCell } from '../types/game'
import type { Enemy, GridPos, Infected } from '../game/hivefallTypes'
import { resolveEnemyEnterTile, resolvePlayerEnterTile } from '../game/collision'

describe('collision', () => {
  it('player entering enemy tile triggers fight', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    const enemies: Enemy[] = [{ id: 1, pos: { row: 2, col: 3 }, hp: 5, maxHp: 5 }]
    const infecteds: Infected[] = []
    const to: GridPos = { row: 2, col: 3 }

    const r = resolvePlayerEnterTile(grid, enemies, infecteds, to)
    expect(r).toEqual({ kind: 'fight', enemyId: 1 })
  })

  it('player entering infected tile is blocked (cannot share tile)', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    const enemies: Enemy[] = []
    const infecteds: Infected[] = [{ id: 1, pos: { row: 1, col: 1 } }]

    const r = resolvePlayerEnterTile(grid, enemies, infecteds, { row: 1, col: 1 })
    expect(r.kind).toBe('blocked')
    if (r.kind === 'blocked') expect(r.reason).toBe('entity')
  })

  it('enemy entering player tile triggers fight', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    const player: GridPos = { row: 2, col: 2 }
    const infecteds: Infected[] = []

    const r = resolveEnemyEnterTile(grid, player, infecteds, 7, { row: 2, col: 2 })
    expect(r).toEqual({ kind: 'fight', enemyId: 7 })
  })

  it('enemy entering infected tile returns hit_infected', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    const player: GridPos = { row: 4, col: 4 }
    const infecteds: Infected[] = [{ id: 22, pos: { row: 2, col: 2 } }]

    const r = resolveEnemyEnterTile(grid, player, infecteds, 7, { row: 2, col: 2 })
    expect(r).toEqual({ kind: 'hit_infected', infectedId: 22 })
  })

  it('player is blocked by blocked terrain (^)', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    grid[1][1].terrain = '^'

    const r = resolvePlayerEnterTile(grid, [], [], { row: 1, col: 1 })
    expect(r.kind).toBe('blocked')
    if (r.kind === 'blocked') expect(r.reason).toBe('terrain')
  })

  it('player entering empty walkable tile is ok', () => {
    const grid: GameCell[][] = createEmptyGrid(5, 5, '.')
    const r = resolvePlayerEnterTile(grid, [], [], { row: 4, col: 4 })
    expect(r).toEqual({ kind: 'ok' })
  })
})
