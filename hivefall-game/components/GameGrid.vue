<!-- components/GameGrid.vue -->
<template>
  <div
    class="hg-grid-wrap hf-glass--soft hf-accent-border hf-accent-glow"
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
  infectedChar: '☺',
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

  const centerR = Math.floor(rows / 2)
  const centerC = Math.floor(cols / 2)
  g[centerR][centerC].entity = 'player'

  localCells.value = g
}

watch(
  () => [props.rows, props.cols],
  () => rebuildLocalGrid(),
  { immediate: true }
)

const displayCells = computed<GameCell[][]>(() => {
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

  overflow-x: auto;
  width: fit-content;
  max-width: 100%;
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

  border-radius: 6px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.22);
  background: rgba(0, 0, 0, 0.18);

  color: rgb(var(--v-theme-on-surface));
  padding: 0;
  cursor: pointer;

  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  line-height: 1;
  user-select: none;

  transition: border-color 120ms ease, box-shadow 120ms ease, transform 80ms ease;
}

.hg-cell:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.hg-cell:active {
  transform: translateY(0.5px);
}

.hg-glyph {
  font-size: calc(var(--hg-cell) * 0.78);
  transform: translateY(-0.5px);
}

/* Terrain (subtle) */
.hg-cell[data-terrain="^"] { background: rgba(var(--v-theme-on-surface), 0.05); }
.hg-cell[data-terrain="~"] { background: rgba(var(--v-theme-on-surface), 0.035); }
.hg-cell[data-terrain="#"] { background: rgba(var(--v-theme-on-surface), 0.075); }

/* Player: FILLED neon green */
.hg-cell[data-entity="player"] {
  background: rgba(var(--v-theme-primary), 0.55);
  border-color: rgba(var(--v-theme-primary), 0.95);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.45),
    0 0 18px rgba(var(--v-theme-primary), 0.28);
  color: rgba(0, 0, 0, 0.88);
  font-weight: 800;
}

/* Infected: OUTLINED neon green */
.hg-cell[data-entity="infected"] {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(var(--v-theme-primary), 0.9);
  box-shadow: 0 0 14px rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary));
  font-weight: 800;
}

/* Enemy: OUTLINED neon magenta (secondary) */
.hg-cell[data-entity="enemy"] {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(var(--v-theme-secondary), 0.9);
  box-shadow: 0 0 14px rgba(var(--v-theme-secondary), 0.18);
  color: rgb(var(--v-theme-secondary));
  font-weight: 800;
}

/* Resource: cyan-ish (info) */
.hg-cell[data-entity="resource"] {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(var(--v-theme-info), 0.85);
  box-shadow: 0 0 12px rgba(var(--v-theme-info), 0.14);
  color: rgb(var(--v-theme-info));
  font-weight: 800;
}

.hg-cell[data-state="blocked"] { opacity: 0.6; }

.hg-cell:focus-visible {
  outline: 2px solid rgba(var(--v-theme-primary), 0.95);
  outline-offset: 2px;
}
</style>
