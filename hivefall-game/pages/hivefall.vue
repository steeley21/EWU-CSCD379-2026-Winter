<!-- pages/hivefall.vue -->
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

    <!-- Game Over + Submit Score -->
    <v-dialog :model-value="gameOver" max-width="520" persistent>
      <v-card class="hf-glass hf-accent-border" variant="flat">
        <v-card-title class="text-h6 text-center">
          {{ status === 'won' ? 'You Win!' : 'Game Over' }}
        </v-card-title>

        <v-card-text class="text-body-2">
          <div class="text-center">
            <div>Moves: {{ moveCount }}</div>
            <div class="mt-1">Total Infected: {{ infectedCount }}</div>
            <div class="mt-1">Active Infected: {{ infectedActiveCount }}</div>
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-2">Submit your score</div>

          <v-text-field
            ref="nameField"
            v-model="nameInput"
            label="Name on leaderboard"
            variant="outlined"
            density="comfortable"
            maxlength="32"
            counter="32"
            hide-details="auto"
            :disabled="submitting || submitted || submitWarming"
          />

          <!-- Submit feedback -->
          <v-alert
            v-if="submitWarming"
            type="info"
            variant="tonal"
            class="mt-2"
          >
            <div class="d-flex flex-column ga-1">
              <div>Submitting score… leaderboard is waking up.</div>
              <div class="text-body-2">
                Retrying in <strong>{{ submitRetryIn }}</strong>s
                <span v-if="submitRetryAttempt > 0">
                  (attempt {{ submitRetryAttempt }} of {{ maxSubmitRetries }})
                </span>.
              </div>

              <div class="d-flex ga-2 mt-2">
                <v-btn size="small" variant="outlined" @click="submitScore({ force: true })">
                  Retry now
                </v-btn>
                <v-btn size="small" variant="text" @click="cancelSubmitRetries">
                  Stop retrying
                </v-btn>
              </div>
            </div>
          </v-alert>

          <div v-else-if="submitting" class="mt-2 hf-muted">
            Submitting score…
          </div>

          <div v-else-if="submitError" class="mt-2 hf-muted">
            {{ submitError }}
          </div>

          <div v-else-if="submitted" class="mt-2 hf-muted">
            Submitted! 🎉
          </div>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            :loading="submitting"
            :disabled="submitted || submitting"
            @click="submitScore({ force: true })"
          >
            Submit Score
          </v-btn>

          <v-btn variant="outlined" to="/leaderboard">
            View Leaderboard
          </v-btn>

          <v-spacer />

          <v-btn color="primary" variant="outlined" @click="reset">
            Play Again
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useDisplay } from 'vuetify'
import axios from 'axios'

import GameGrid from '../components/GameGrid.vue'
import DPad from '../components/DPad.vue'
import FightDialog from '../components/FightDialog.vue'
import InventoryDialog from '../components/InventoryDialog.vue'

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

const { giveUpFn } = useHivefallHeaderActions()

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

onMounted(() => {
  giveUpFn.value = giveUp
})

onBeforeUnmount(() => {
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
  clearFight()
}

/* ---- Submit score step ---- */
const { submitRun } = useHivefallApi()

const playerNameCookie = useCookie<string>('hf-player-name', { default: () => '' })
const nameInput = ref(playerNameCookie.value || '')

const submitting = ref(false)
const submitted = ref(false)
const submitError = ref<string | null>(null)

// Warming / retry state
const submitWarming = ref(false)
const submitRetryAttempt = ref(0)
const submitRetryIn = ref(0)
const maxSubmitRetries = 6

let submitRetryTimeout: ReturnType<typeof setTimeout> | null = null
let submitCountdownInterval: ReturnType<typeof setInterval> | null = null

const submitBackoffSeconds = [2, 3, 5, 8, 13, 13]

function clearSubmitTimers() {
  if (submitRetryTimeout) {
    clearTimeout(submitRetryTimeout)
    submitRetryTimeout = null
  }
  if (submitCountdownInterval) {
    clearInterval(submitCountdownInterval)
    submitCountdownInterval = null
  }
}

function cancelSubmitRetries() {
  clearSubmitTimers()
  submitWarming.value = false
  submitRetryAttempt.value = 0
  submitRetryIn.value = 0
}

function startSubmitCountdown(seconds: number) {
  submitRetryIn.value = seconds
  submitCountdownInterval = setInterval(() => {
    submitRetryIn.value = Math.max(0, submitRetryIn.value - 1)
    if (submitRetryIn.value === 0 && submitCountdownInterval) {
      clearInterval(submitCountdownInterval)
      submitCountdownInterval = null
    }
  }, 1000)
}

function getHttpStatus(e: unknown): number | null {
  if (!axios.isAxiosError(e)) return null
  return e.response?.status ?? null
}

function getApiMessage(e: unknown): string | null {
  if (!axios.isAxiosError(e)) return null
  const data = e.response?.data as any
  const msg = data?.message
  return typeof msg === 'string' ? msg : null
}

watch(
  status,
  (s) => {
    if (s === 'playing') {
      submitting.value = false
      submitted.value = false
      submitError.value = null
      cancelSubmitRetries()
      return
    }

    // when game ends, prefill from cookie
    nameInput.value = playerNameCookie.value || ''
  },
  { flush: 'post' }
)

async function submitScore(opts: { force?: boolean } = {}): Promise<void> {
  if (submitted.value) return

  // force = user clicked "Retry now" / Submit again
  if (opts.force) cancelSubmitRetries()

  // If we are in a warming retry loop, don't allow parallel submits
  if (submitting.value) return

  submitting.value = true
  submitError.value = null
  submitWarming.value = false

  const trimmed = (nameInput.value || '').trim().slice(0, 32)
  const finalName = trimmed.length ? trimmed : 'Player'

  // persist name for next run
  playerNameCookie.value = finalName
  nameInput.value = finalName

  try {
    await submitRun({
      playerName: finalName,
      won: status.value === 'won',
      moveCount: moveCount.value,
      infectedCount: infectedCount.value,
    })
    submitted.value = true
    submitWarming.value = false
    cancelSubmitRetries()
  } catch (e) {
    const statusCode = getHttpStatus(e)

    // 503 = API says "waking up"
    if (statusCode === 503 && submitRetryAttempt.value < maxSubmitRetries) {
      submitting.value = false
      submitted.value = false
      submitWarming.value = true
      submitError.value = null

      submitRetryAttempt.value += 1
      const wait = submitBackoffSeconds[Math.min(submitRetryAttempt.value - 1, submitBackoffSeconds.length - 1)]

      clearSubmitTimers()
      startSubmitCountdown(wait)

      submitRetryTimeout = setTimeout(() => {
        submitScore()
      }, wait * 1000)

      return
    }

    // Other errors or out of retries
    const apiMsg = getApiMessage(e)
    submitting.value = false
    submitted.value = false
    submitWarming.value = false

    if (statusCode === 503) {
      submitError.value = apiMsg ?? 'Leaderboard is still waking up. Please try again in a moment.'
    } else {
      submitError.value = apiMsg ?? 'Failed to submit score. You can try again, or just play again.'
    }
  } finally {
    // If we scheduled a retry, we already returned above
    // so this only runs for success/final-failure paths
    submitting.value = false
  }
}

// Auto-focus + optional auto-submit on Game Over dialog open
type Focusable = { focus: () => void }
const nameField = ref<Focusable | null>(null)

let autoSubmitTimer: ReturnType<typeof setTimeout> | null = null

watch(
  gameOver,
  async (open) => {
    if (!open) {
      if (autoSubmitTimer) {
        clearTimeout(autoSubmitTimer)
        autoSubmitTimer = null
      }
      return
    }

    await nextTick()
    nameField.value?.focus?.()

    const cookieName = (playerNameCookie.value ?? '').trim()
    const inputName = (nameInput.value ?? '').trim()

    if (!cookieName) return
    if (submitted.value || submitting.value || submitWarming.value) return
    if (inputName !== cookieName) return

    autoSubmitTimer = setTimeout(() => {
      if (!gameOver.value) return

      const stillCookie = (playerNameCookie.value ?? '').trim()
      const stillInput = (nameInput.value ?? '').trim()

      if (!stillCookie) return
      if (stillInput !== stillCookie) return
      if (submitted.value || submitting.value || submitWarming.value) return

      void submitScore({ force: true })
    }, 500)
  },
  { flush: 'post' }
)

onBeforeUnmount(() => {
  clearSubmitTimers()
  if (autoSubmitTimer) clearTimeout(autoSubmitTimer)
})
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
