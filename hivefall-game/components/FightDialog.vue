<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)"
    max-width="560"
    persistent
  >
    <v-card class="hf-card">
      <v-card-title class="text-h6 text-center">
        <span v-if="phase === 'won'">Enemy Defeated</span>
        <span v-else-if="phase === 'combat'">Fight!</span>
        <span v-else>...</span>
      </v-card-title>

      <!-- One clean v-if chain that contains BOTH text + actions -->
      <template v-if="phase === 'interlude'">
        <v-card-text class="hf-body">
          <div class="hf-narration">
            You encounter an enemy. They hesitate…
          </div>
          <div class="hf-subtle mt-2">
            Something about their eyes makes you uneasy.
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-6">
          <v-btn :ripple="false" variant="outlined" @click="$emit('run')">Run</v-btn>
          <v-spacer />
          <v-btn :ripple="false" color="primary" variant="tonal" @click="$emit('engage')">
            Attack
          </v-btn>
        </v-card-actions>
      </template>

      <template v-else-if="phase === 'combat'">
        <v-card-text class="hf-body">
          <v-container class="pa-0">
            <v-row class="ma-0" align="center" justify="space-between" no-gutters>
              <v-col cols="5" class="text-center">
                <div class="hf-avatar" aria-label="Smiley">☻</div>
                <div class="hf-hp">HP {{ hp }} / {{ maxHp }}</div>
              </v-col>

              <v-col cols="2" class="text-center hf-vs">VS</v-col>

              <v-col cols="5" class="text-center">
                <div class="hf-avatar" aria-label="Enemy">E</div>
                <div class="hf-hp">HP {{ enemyHp }} / {{ enemyMaxHp }}</div>
              </v-col>
            </v-row>

            <div class="hf-subtle text-center mt-4">
              Enemy hits for {{ enemyDmg }} every {{ enemyHitIntervalMs / 1000 }}s
            </div>
          </v-container>
        </v-card-text>

        <v-card-actions class="hf-actions px-6 pb-6">
          <div class="hf-actions-inner">
            <v-btn
              :ripple="false"
              class="hf-hit-btn"
              :class="{ 'hf-ready': hitReady, 'hf-pulse': pulseReady }"
              variant="outlined"
              :disabled="!hitReady"
              :style="hitStyle"
              @click="emitHit"
            >
              Hit - {{ playerDmg }} dmg
            </v-btn>
          </div>
        </v-card-actions>
      </template>

      <template v-else>
        <v-card-text class="hf-body">
          <div class="hf-narration">
            The enemy collapses. For a moment, they almost look relieved.
          </div>

          <div class="hf-subtle mt-3">Drops:</div>

          <v-list density="comfortable" class="hf-drops mt-2" lines="one">
            <v-list-item v-for="(d, i) in dropsToShow" :key="i" class="hf-drop-item">
              <template #prepend>
                <span class="hf-drop-icon" aria-hidden="true">✦</span>
              </template>
              <v-list-item-title>{{ d }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions class="hf-actions px-6 pb-6">
          <div class="hf-actions-inner">
            <v-btn
              :ripple="false"
              color="primary"
              variant="tonal"
              @click="$emit('update:modelValue', false)"
            >
              Continue
            </v-btn>
          </div>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'

type FightPhase = 'interlude' | 'combat' | 'won'

type Props = {
  modelValue: boolean
  phase: FightPhase
  drops: string[]

  // player HUD
  hp: number
  maxHp: number

  // enemy
  enemyId: number | null
  enemyHp: number
  enemyMaxHp: number

  // combat numbers
  playerDmg: number
  enemyDmg: number
  enemyHitIntervalMs: number

  // cooldown UI
  attackReady: boolean
  attackCooldownRemainingMs: number
  attackCooldownMs: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'run'): void
  (e: 'engage'): void
  (e: 'hit'): void
}>()

const dropsToShow = computed(() => {
  return props.drops?.length ? props.drops : ['???', '???', '???']
})

const hitReady = computed(() => props.phase === 'combat' && props.attackReady)

const hitProgress = computed(() => {
  if (props.phase !== 'combat') return 0
  const total = Math.max(1, props.attackCooldownMs)
  const remaining = Math.max(0, props.attackCooldownRemainingMs)
  const p = 1 - remaining / total
  return Math.max(0, Math.min(1, p))
})

const hitStyle = computed(() => ({
  '--hf-hit-progress': String(hitProgress.value),
}))

function emitHit(): void {
  if (!hitReady.value) return
  emit('hit')
}

// --- Pulse when hit becomes ready (combat-only, not on open) ---
const pulseReady = ref(false)
const hadCooldown = ref(false)
let pulseTimer: number | null = null

function startPulse(): void {
  pulseReady.value = false
  requestAnimationFrame(() => {
    pulseReady.value = true
  })

  if (pulseTimer != null) window.clearTimeout(pulseTimer)
  pulseTimer = window.setTimeout(() => {
    pulseReady.value = false
    pulseTimer = null
  }, 650)
}

watch(
  () => (props.phase === 'combat' ? props.attackCooldownRemainingMs : 0),
  (ms) => {
    if (props.phase === 'combat' && ms > 0) hadCooldown.value = true
  }
)

watch(
  () => hitReady.value,
  (ready, prev) => {
    if (prev === false && ready === true && hadCooldown.value) {
      startPulse()
      hadCooldown.value = false
    }
  }
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      pulseReady.value = false
      hadCooldown.value = false
      if (pulseTimer != null) {
        window.clearTimeout(pulseTimer)
        pulseTimer = null
      }
    }
  }
)

onBeforeUnmount(() => {
  if (pulseTimer != null) window.clearTimeout(pulseTimer)
})
</script>

<style scoped>
.hf-card {
  border-radius: 14px;
}

.hf-body {
  padding: 18px 24px 10px;
}

.hf-narration {
  font-size: 1.02rem;
  line-height: 1.4;
}

.hf-subtle {
  opacity: 0.8;
}

.hf-avatar {
  font-size: 56px;
  line-height: 1;
  user-select: none;
}

.hf-vs {
  opacity: 0.6;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hf-hp {
  margin-top: 10px;
  font-weight: 600;
}

.hf-actions {
  display: flex;
  justify-content: center;
}

.hf-actions-inner {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Hit button w/ recharge fill */
.hf-hit-btn {
  position: relative;
  overflow: hidden;

  min-width: 220px;

  background: rgba(var(--v-theme-on-surface), 0.06) !important;
  opacity: 1 !important;

  transition: filter 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.hf-hit-btn::before {
  content: '';
  position: absolute;
  inset: 0;

  background: rgba(var(--v-theme-primary), 0.18);

  transform-origin: left;
  transform: scaleX(var(--hf-hit-progress, 0));
  transition: transform 50ms linear;

  pointer-events: none;
}

.hf-hit-btn :deep(.v-btn__content) {
  position: relative;
  z-index: 1;
}

.hf-hit-btn:deep(.v-btn--disabled),
.hf-hit-btn.v-btn--disabled {
  filter: grayscale(0.35) saturate(0.75);
}

.hf-hit-btn.hf-ready {
  filter: saturate(1.08);
}

.hf-hit-btn.hf-pulse {
  animation: hf-ready-pulse 650ms ease-out 1;
}

@keyframes hf-ready-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.0);
  }
  25% {
    transform: scale(1.03);
    box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0.22);
  }
  55% {
    transform: scale(1.01);
    box-shadow: 0 0 0 16px rgba(var(--v-theme-primary), 0.10);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.0);
  }
}

.hf-drops {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: 12px;
}

.hf-drop-item {
  min-height: 40px;
}

.hf-drop-icon {
  display: inline-block;
  width: 18px;
  text-align: center;
  opacity: 0.7;
}
</style>
