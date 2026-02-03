// types/game.ts
export type Terrain = '.' | '^' | '~' | '#'
export type Entity = 'player' | 'enemy' | 'infected' | 'resource' | null

export type CellState = 'normal' | 'blocked' | 'danger' | 'loot'

export interface GameCell {
  terrain: Terrain
  entity: Entity
  // optional hooks for later (fog-of-war, pathing, etc.)
  revealed?: boolean
  state?: CellState
}

export function createEmptyGrid(rows: number, cols: number, terrain: Terrain = '.'): GameCell[][] {
  const grid: GameCell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: GameCell[] = []
    for (let c = 0; c < cols; c++) {
      row.push({ terrain, entity: null })
    }
    grid.push(row)
  }
  return grid
}
