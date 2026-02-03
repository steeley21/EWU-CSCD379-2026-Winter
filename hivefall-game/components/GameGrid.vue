<template>
  <div
    class="hg-grid-wrap"
    :style="wrapStyle"
    role="grid"
    aria-label="Hivefall grid"
  >
    <div
      v-for="(row, r) in displayCells"
      :key="r"
      class="hg-row"
      role="row"
    >
      <button
        v-for="(cell, c) in row"
        :key="c"
        type="button"
        class="hg-cell"
        role="gridcell"
        :data-terrain="cell.terrain"
        :data-entity="cell.entity ?? 'none'"
        :data-state="cell.state ?? 'normal'"
        :aria-label="`Row ${r + 1} Col ${c + 1}`"
        @click="emitCellClick(r, c, cell)"
      >
        <span class="hg-glyph">{{ glyphFor(cell) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createEmptyGrid } from '../types/game'
import type { GameCell, Terrain } from '../types/game'

type Props = {
  // If not provided, GameGrid will generate a test grid internally.
  cells?: GameCell[][]
  rows?: number
  cols?: number

  cellSizePx?: number
  gapPx?: number

  playerChar?: string
  infectedChar?: string
  enemyChar?: string
  resourceChar?: string
  terrainGlyphs?: Partial<Record<Terrain, string>>
}

const props = withDefaults(defineProps<Props>(), {
  rows: 14,
  cols: 24,
  cellSizePx: 24,
  gapPx: 2,
  playerChar: '☻',
  infectedChar: '☻',
  enemyChar: 'E',
  resourceChar: '*',
  terrainGlyphs: () => ({
    '.': '.',
    '^': '^',
    '~': '~',
    '#': '#',
  }),
})

const emit = defineEmits<{
  (e: 'cell-click', payload: { row: number; col: number; cell: GameCell }): void
}>()

const localCells = ref<GameCell[][]>([])

function rebuildLocalGrid(): void {
  const rows = props.rows
  const cols = props.cols

  const g = createEmptyGrid(rows, cols, '.')

  // Smiley in the center (0-based indexing)
  const centerR = Math.floor(rows / 2)
  const centerC = Math.floor(cols / 2)
  g[centerR][centerC].entity = 'player'

  localCells.value = g
}

// Build once, and rebuild if rows/cols change
watch(
  () => [props.rows, props.cols],
  () => rebuildLocalGrid(),
  { immediate: true }
)

const displayCells = computed<GameCell[][]>(() => {
  // If parent passes a grid, use it. Otherwise use the internal test grid.
  return props.cells && props.cells.length ? props.cells : localCells.value
})

const wrapStyle = computed(() => ({
  '--hg-cell': `${props.cellSizePx}px`,
  '--hg-gap': `${props.gapPx}px`,
}))

function emitCellClick(row: number, col: number, cell: GameCell): void {
  emit('cell-click', { row, col, cell })
}

function glyphFor(cell: GameCell): string {
  switch (cell.entity) {
    case 'player':
      return props.playerChar
    case 'infected':
      return props.infectedChar
    case 'enemy':
      return props.enemyChar
    case 'resource':
      return props.resourceChar
    default:
      return props.terrainGlyphs[cell.terrain] ?? cell.terrain
  }
}
</script>

<style scoped>
.hg-grid-wrap {
  display: grid;
  gap: var(--hg-gap);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(127, 127, 127, 0.35);
  overflow-x: auto;
  width: fit-content;
  max-width: 100%;
  background: rgba(127, 127, 127, 0.06);
}

.hg-row {
  display: grid;
  grid-auto-flow: column;
  gap: var(--hg-gap);
}

.hg-cell {
  width: var(--hg-cell);
  height: var(--hg-cell);
  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;
  border: 1px solid rgba(127, 127, 127, 0.25);
  background: transparent;

  padding: 0;
  cursor: pointer;

  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  line-height: 1;
  user-select: none;
}

.hg-glyph {
  font-size: calc(var(--hg-cell) * 0.78);
  transform: translateY(-0.5px);
}

/* Terrain styling */
.hg-cell[data-terrain="^"] { background: rgba(127, 127, 127, 0.10); }
.hg-cell[data-terrain="~"] { background: rgba(127, 127, 127, 0.08); }
.hg-cell[data-terrain="#"] { background: rgba(127, 127, 127, 0.14); }

/* Entity styling */
.hg-cell[data-entity="player"],
.hg-cell[data-entity="infected"] {
  background: rgba(127, 127, 127, 0.18);
  font-weight: 700;
}

.hg-cell[data-entity="enemy"] {
  background: rgba(127, 127, 127, 0.12);
  font-weight: 700;
}

.hg-cell[data-entity="resource"] {
  background: rgba(127, 127, 127, 0.10);
  font-weight: 700;
}

.hg-cell[data-state="blocked"] { opacity: 0.6; }
.hg-cell:focus-visible { outline: 2px solid rgba(127,127,127,0.65); outline-offset: 2px; }
</style>
