<template>
  <v-container fluid class="hf-page pa-2">
    <v-row
      class="hf-layout ga-3"
      justify="center"
      align="center"
      no-gutters
      :class="{
        'flex-nowrap': !stacked,
        'flex-column': stacked,
      }"
    >
      <v-col cols="auto" class="d-flex justify-center">
        <GameGrid
          :cells="grid"
          :cell-size-px="cellSizePx"
          :gap-px="gridGapPx"
          @cell-click="onCellClick"
        />
      </v-col>

      <v-col cols="auto" class="d-flex justify-center">
        <DPad
          :disabled="!controlsEnabled"
          :btn-size-px="dpadBtnPx"
          :gap-px="dpadGapPx"
          :pad-px="dpadPadPx"
          :on-up="moveUp"
          :on-down="moveDown"
          :on-left="moveLeft"
          :on-right="moveRight"
        />
      </v-col>
    </v-row>

    <FightDialog
      v-model="fightOpen"
      :enemy-id="fightEnemyId"
      @attack="onAttack"
      @run="onRun"
      @close="onCloseFight"
    />
  </v-container>
</template>


<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'

import GameGrid from '../components/GameGrid.vue'
import DPad from '../components/DPad.vue'
import FightDialog from '../components/FightDialog.vue'

import type { GameCell } from '../types/game'
import { useHivefallEngine } from '../composables/useHivefallEngine'
import { usePlayerControls } from '../composables/usePlayerControls'
import { useHivefallHeaderActions } from '../composables/useHivefallHeaderActions'
import { defaultHivefallRules } from '../game/hivefallRules'

const ROWS = defaultHivefallRules.rows
const COLS = defaultHivefallRules.cols

const { width, height, mdAndUp } = useDisplay()
const stacked = computed(() => !mdAndUp.value)

const dpadGapPx = computed(() => (height.value < 820 ? 8 : 10))
const dpadPadPx = computed(() => 10)
const gridGapPx = computed(() => (height.value < 820 ? 1 : 2))

const HEADER_H = 64
const PAGE_PAD = 16
const availableH = computed(() => Math.max(240, height.value - HEADER_H - PAGE_PAD))

const dpadBtnPx = computed(() => {
  const candidate = Math.floor((availableH.value - 2 * dpadPadPx.value - 2 * dpadGapPx.value) / 3)
  return Math.max(34, Math.min(52, candidate))
})

const dpadH = computed(() => 3 * dpadBtnPx.value + 2 * dpadGapPx.value + 2 * dpadPadPx.value)
const dpadW = computed(() => 3 * dpadBtnPx.value + 2 * dpadGapPx.value + 2 * dpadPadPx.value)

const gridAvailableH = computed(() => {
  return stacked.value ? Math.max(160, availableH.value - dpadH.value - 12) : availableH.value
})

const gridAvailableW = computed(() => {
  return stacked.value
    ? Math.max(320, width.value - 32)
    : Math.max(320, width.value - dpadW.value - 48)
})

const cellSizePx = computed(() => {
  const byW = Math.floor((gridAvailableW.value - (COLS - 1) * gridGapPx.value) / COLS)
  const byH = Math.floor((gridAvailableH.value - (ROWS - 1) * gridGapPx.value) / ROWS)
  return Math.max(10, Math.min(24, Math.min(byW, byH)))
})

const { resetFn } = useHivefallHeaderActions()

const {
  grid,
  reset,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
  fight,
  clearFight, 
  resolveFight
} = useHivefallEngine({
  rows: ROWS,
  cols: COLS,
  terrain: '.',
})

const controlsEnabled = computed(() => fight.value == null)

// Dialog v-model that clears fight when closed
const fightOpen = computed<boolean>({
  get: () => fight.value != null,
  set: (open) => {
    if (!open) clearFight()
  },
})

const fightEnemyId = computed(() => fight.value?.enemyId ?? null)

onMounted(() => {
  resetFn.value = reset
})

onBeforeUnmount(() => {
  resetFn.value = null
})

// disable keyboard input when fight is open
usePlayerControls({
  onUp: moveUp,
  onDown: moveDown,
  onLeft: moveLeft,
  onRight: moveRight,
  enabled: controlsEnabled,
})

function onAttack(enemyId: number | null): void {
  console.log('ATTACK clicked', enemyId)
  resolveFight('attack')
}

function onRun(enemyId: number | null): void {
  console.log('RUN clicked', enemyId)
  resolveFight('run')
}

function onCloseFight(): void {
  clearFight()
}

function onCellClick(payload: { row: number; col: number; cell: GameCell }): void {
  console.log('clicked', payload)
}
</script>



<style scoped>
.hf-page {
  /* keep everything on one screen */
  height: calc(100dvh - 64px);
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}

.hf-layout {
  width: 100%;
  justify-content: center;
  align-items: center;
}
</style>
