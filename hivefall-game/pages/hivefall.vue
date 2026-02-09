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

      <v-col cols="auto" class="d-flex flex-column align-center">
        <div class="hf-controls">
          <div class="hf-controls-top">
            <v-btn
              variant="outlined"
              size="small"
              class="me-2"
              :disabled="status !== 'playing'"
              @click="inventoryOpen = true"
            >
              Inventory
            </v-btn>

            <v-select
              v-model="debugWeaponId"
              :items="debugWeaponOptions"
              item-title="title"
              item-value="value"
              density="compact"
              hide-details
              variant="outlined"
              style="min-width: 180px"
              class="me-2"
              :disabled="status !== 'playing'"
            />

            <v-btn
              variant="tonal"
              size="small"
              :disabled="status !== 'playing' || !debugWeaponId"
              @click="onDebugAddWeapon"
            >
              Add
            </v-btn>
          </div>

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

          <!-- Lightweight HUD -->
          <div class="hf-subtle mt-2 text-center">
            <div>Moves: {{ moveCount }}</div>
            <div>Total Infected: {{ infectedCount }}</div>
            <div>Active Infected: {{ infectedActiveCount }}</div>
          </div>
        </div>
      </v-col>
    </v-row>

    <FightDialog
      v-model="fightOpen"
      :phase="(fightPhase ?? 'interlude')"
      :drops="fightDrops"
      :won-choice="fightWonChoice"
      :weapons="weaponsUI"
      :food="foodCount"
      :enemy-id="fightEnemyId"
      :hp="playerHp"
      :max-hp="playerMaxHp"
      :enemy-hp="fightEnemyHp"
      :enemy-max-hp="fightEnemyMaxHp"
      :enemy-dmg="rules.combat.enemyHitDamage"
      :enemy-hit-interval-ms="rules.combat.enemyHitIntervalMs"
      @engage="onEngage"
      @attack="onAttack"
      @use-food="onUseFood"
      @run="onRun"
      @harvest="onHarvest"
      @acquire="onAcquire"
      @continue="onContinueWon"
    />

    <InventoryDialog v-model="inventoryOpen" :food="foodCount" :items="inventoryUI" />

    <v-dialog :model-value="gameOver" max-width="420" persistent>
      <v-card class="hf-glass hf-accent-border" variant="flat">
        <v-card-title class="text-h6 text-center">
          {{ status === 'won' ? 'You Win!' : 'Game Over' }}
        </v-card-title>

        <v-card-text class="text-body-2 text-center">
          <div>Moves: {{ moveCount }}</div>
          <div class="mt-1">Total Infected: {{ infectedCount }}</div>
          <div class="mt-1">Active Infected: {{ infectedActiveCount }}</div>
        </v-card-text>

        <v-card-actions>
          <v-btn block color="primary" variant="tonal" @click="reset">Play Again</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
/// <reference types="vue" />
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

import GameGrid from '../components/GameGrid.vue'
import DPad from '../components/DPad.vue'
import FightDialog from '../components/FightDialog.vue'
import InventoryDialog from '../components/InventoryDialog.vue'

import type { GameCell } from '../types/game'
import type { WeaponId } from '../game/hivefallRules'
import { useHivefallEngine } from '../composables/useHivefallEngine'
import { usePlayerControls } from '../composables/usePlayerControls'
import { useHivefallHeaderActions } from '../composables/useHivefallHeaderActions'
import { defaultHivefallRules } from '../game/hivefallRules'
import { useHivefallApi } from '../composables/useHivefallApi'

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

const { resetFn, giveUpFn } = useHivefallHeaderActions()

const {
  rules,
  grid,
  reset,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
  fight,
  fightPhase,
  fightWonChoice,
  clearFight,
  resolveFight,
  engageFight,
  chooseWonOutcome,
  status,
  giveUp,
  moveCount,
  infectedCount,
  infectedActiveCount,
  playerHp,
  playerMaxHp,
  weaponsUI,
  inventoryUI,
  grantWeapon,
  foodCount,
} = useHivefallEngine({ rows: ROWS, cols: COLS, terrain: '.' })

const fightDrops = computed(() => fight.value?.drops ?? [])
const fightEnemyHp = computed(() => fight.value?.enemyHp ?? 0)
const fightEnemyMaxHp = computed(() => fight.value?.enemyMaxHp ?? 0)

const gameOver = computed(() => status.value !== 'playing')
const controlsEnabled = computed(() => fight.value == null && status.value === 'playing')

const fightOpen = computed<boolean>({
  get: () => fight.value != null,
  set: (open) => {
    if (!open) clearFight()
  },
})

const fightEnemyId = computed(() => fight.value?.enemyId ?? null)

const inventoryOpen = ref(false)

const debugWeaponOptions = computed(() => {
  return (Object.values(rules.weapons) as { id: WeaponId; name: string }[])
    .filter(w => w.id !== 'hit')
    .map(w => ({ title: w.name, value: w.id }))
})

const debugWeaponId = ref<WeaponId>('sword')

function onDebugAddWeapon(): void {
  if (status.value !== 'playing') return
  grantWeapon(debugWeaponId.value)
}

onMounted(() => {
  resetFn.value = reset
  giveUpFn.value = giveUp
})

onBeforeUnmount(() => {
  resetFn.value = null
  giveUpFn.value = null
})

usePlayerControls({
  onUp: moveUp,
  onDown: moveDown,
  onLeft: moveLeft,
  onRight: moveRight,
  enabled: controlsEnabled,
})

function onEngage(): void {
  engageFight()
}

function onAttack(weaponId: WeaponId): void {
  resolveFight({ kind: 'attack', weaponId })
}

function onUseFood(): void {
  resolveFight({ kind: 'use_food' })
}

function onRun(): void {
  resolveFight({ kind: 'run' })
}

function onHarvest(): void {
  chooseWonOutcome('harvest')
}

function onAcquire(): void {
  chooseWonOutcome('acquire')
}

function onContinueWon(): void {
  // Fight dialog closes only after a Harvest/Acquire choice
  clearFight()
}

function onCellClick(payload: { row: number; col: number; cell: GameCell }): void {
  console.log('clicked', payload)
}

/**
 * Auto-submit run results when the game ends (won/lost).
 * This keeps the pure engine free of network concerns and submits once per run.
 */
const { submitRun } = useHivefallApi()
const playerName = useCookie<string>('hf-player-name', { default: () => 'Player' })
const submittedThisRun = ref(false)

watch(
  status,
  async (s) => {
    if (s === 'playing') {
      submittedThisRun.value = false
      return
    }

    const isTerminal = s === 'won' || s === 'lost'
    if (!isTerminal) return

    if (submittedThisRun.value) return
    submittedThisRun.value = true

    try {
      await submitRun({
        playerName: playerName.value || 'Player',
        won: s === 'won',
        moveCount: moveCount.value,
        infectedCount: infectedCount.value,
      })
    } catch (e) {
      console.error('Failed to submit run:', e)
      // Optional: allow retry if API was down
      // submittedThisRun.value = false
    }
  },
  { flush: 'post' }
)
</script>

<style scoped>
.hf-page {
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

.hf-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.hf-controls-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
</style>
