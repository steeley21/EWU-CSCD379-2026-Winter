<!-- components/FightDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)"
    max-width="560"
    persistent
  >
    <v-card class="hf-glass hf-accent-border" variant="flat">
      <v-card-title class="text-h6 text-center">
        <span v-if="phase === 'won'">Enemy Defeated</span>
        <span v-else-if="phase === 'combat'">Fight!</span>
        <span v-else>...</span>
      </v-card-title>

      <!-- Interlude -->
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

      <!-- Combat -->
      <template v-else-if="phase === 'combat'">
        <v-card-text class="hf-body">
          <v-container class="pa-0">
            <v-row class="ma-0" align="center" justify="space-between" no-gutters>
              <v-col cols="5" class="text-center">
                <div class="hf-avatar hf-avatar--player" aria-label="Smiley">☻</div>
                <div class="hf-hp">HP {{ hp }} / {{ maxHp }}</div>
              </v-col>

              <v-col cols="2" class="text-center hf-vs">VS</v-col>

              <v-col cols="5" class="text-center">
                <div class="hf-avatar hf-avatar--enemy" aria-label="Enemy">E</div>
                <div class="hf-hp">HP {{ enemyHp }} / {{ enemyMaxHp }}</div>
              </v-col>
            </v-row>

            <div class="hf-subtle text-center mt-4">
              Enemy hits for {{ enemyDmg }} every {{ enemyHitIntervalMs / 1000 }}s
            </div>
          </v-container>
        </v-card-text>

        <v-card-actions class="hf-actions px-6 pb-6">
          <div class="hf-actions-inner hf-actions-wrap">
            <!-- Food heal -->
            <v-btn
              :ripple="false"
              variant="outlined"
              class="hf-food-btn"
              :disabled="food <= 0"
              @click="emitUseFood"
            >
              Food +10 ({{ food }})
            </v-btn>

            <!-- Weapons -->
            <v-btn
              v-for="w in weapons"
              :key="w.id"
              :ripple="false"
              class="hf-weapon-btn"
              :class="{ 'hf-ready': w.ready, 'hf-pulse': isPulsing(w.id) }"
              variant="outlined"
              :disabled="!w.ready"
              :style="weaponStyle(w)"
              @click="emitAttack(w.id)"
            >
              {{ weaponLabel(w) }}
            </v-btn>
          </div>
        </v-card-actions>
      </template>

      <!-- Won -->
      <template v-else>
        <v-card-text class="hf-body">
          <div class="hf-narration">
            The enemy collapses. For a moment, they almost look relieved.
          </div>

          <div class="hf-subtle mt-3">
            Choose what to do:
          </div>

          <div class="mt-3 d-flex flex-wrap ga-2">
            <v-btn
              :ripple="false"
              variant="outlined"
              :disabled="wonChoice != null"
              :color="wonChoice === 'harvest' ? 'primary' : undefined"
              @click="$emit('harvest')"
            >
              Harvest (Food +1)
            </v-btn>

            <v-btn
              :ripple="false"
              variant="outlined"
              :disabled="wonChoice != null"
              :color="wonChoice === 'acquire' ? 'primary' : undefined"
              @click="$emit('acquire')"
            >
              Acquire (Join the Hive)
            </v-btn>
          </div>

          <div class="hf-subtle mt-4">Gained:</div>

          <template v-if="hasDrops">
            <v-list density="comfortable" class="hf-drops mt-2" lines="one">
              <v-list-item v-for="(d, i) in drops" :key="i" class="hf-drop-item">
                <template #prepend>
                  <span class="hf-drop-icon" aria-hidden="true">✦</span>
                </template>
                <v-list-item-title>{{ d }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </template>

          <template v-else>
            <div class="hf-empty-drop mt-2">
              <span class="hf-drop-icon" aria-hidden="true">✦</span>
              <span v-if="wonChoice == null">No rewards yet — choose Harvest or Acquire.</span>
              <span v-else>No additional items gained.</span>
            </div>
          </template>
        </v-card-text>

        <v-card-actions class="hf-actions px-6 pb-6">
          <div class="hf-actions-inner">
            <v-btn
              :ripple="false"
              color="primary"
              variant="tonal"
              :disabled="wonChoice == null"
              @click="$emit('continue')"
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
import { computed, reactive, watch, onBeforeUnmount } from 'vue'
import type { WeaponId } from '../game/hivefallRules'
import type { WonChoice } from '../game/hivefallTypes'

type FightPhase = 'interlude' | 'combat' | 'won'

export type WeaponButtonVm = {
  id: WeaponId
  name: string
  dmg: number
  cooldownMs: number
  cooldownRemainingMs: number
  ready: boolean
  charges: number | null
}

type Props = {
  modelValue: boolean
  phase: FightPhase
  drops: string[]
  wonChoice: WonChoice | null

  hp: number
  maxHp: number
  enemyId: number | null
  enemyHp: number
  enemyMaxHp: number
  enemyDmg: number
  enemyHitIntervalMs: number
  weapons: WeaponButtonVm[]
  food: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'run'): void
  (e: 'engage'): void
  (e: 'attack', weaponId: WeaponId): void
  (e: 'use-food'): void
  (e: 'harvest'): void
  (e: 'acquire'): void
  (e: 'continue'): void
}>()

const hasDrops = computed(() => (props.drops?.length ?? 0) > 0)

function weaponLabel(w: WeaponButtonVm): string {
  if (w.charges != null) return `${w.name} - ${w.charges}`
  return `${w.name} - ${w.dmg} dmg`
}

function weaponProgress(w: WeaponButtonVm): number {
  const total = Math.max(1, w.cooldownMs)
  const remaining = Math.max(0, w.cooldownRemainingMs)
  const p = 1 - remaining / total
  return Math.max(0, Math.min(1, p))
}

function weaponStyle(w: WeaponButtonVm): Record<string, string> {
  return { '--hf-weapon-progress': String(weaponProgress(w)) }
}

function emitAttack(id: WeaponId): void {
  const w = props.weapons.find(x => x.id === id)
  if (!w?.ready) return
  emit('attack', id)
}

function emitUseFood(): void {
  if (props.phase !== 'combat') return
  if ((props.food ?? 0) <= 0) return
  emit('use-food')
}

const pulse = reactive<Record<string, boolean>>({})
const hadCooldown = reactive<Record<string, boolean>>({})
const prevReady = reactive<Record<string, boolean>>({})
const timers = new Map<string, number>()

function isPulsing(id: string): boolean {
  return pulse[id] === true
}

function startPulse(id: string): void {
  pulse[id] = false
  requestAnimationFrame(() => (pulse[id] = true))

  const existing = timers.get(id)
  if (existing != null) window.clearTimeout(existing)

  const t = window.setTimeout(() => {
    pulse[id] = false
    timers.delete(id)
  }, 650)

  timers.set(id, t)
}

watch(
  () => props.weapons.map(w => ({ id: w.id, ready: w.ready, rem: w.cooldownRemainingMs })),
  (arr) => {
    if (props.phase !== 'combat') return

    for (const w of arr) {
      if (w.rem > 0) hadCooldown[w.id] = true

      const was = prevReady[w.id]
      const now = w.ready

      if (was === false && now === true && hadCooldown[w.id]) {
        startPulse(w.id)
        hadCooldown[w.id] = false
      }

      prevReady[w.id] = now
    }
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      for (const k of Object.keys(pulse)) pulse[k] = false
      for (const k of Object.keys(hadCooldown)) hadCooldown[k] = false
      for (const k of Object.keys(prevReady)) prevReady[k] = false

      for (const t of timers.values()) window.clearTimeout(t)
      timers.clear()
    }
  }
)

onBeforeUnmount(() => {
  for (const t of timers.values()) window.clearTimeout(t)
  timers.clear()
})
</script>

<style scoped>
.hf-avatar {
  font-size: 56px;
  line-height: 1;
  user-select: none;
  text-shadow: 0 0 16px rgba(0, 0, 0, 0.35);
}

.hf-avatar--player {
  color: rgb(var(--v-theme-primary));
  text-shadow: 0 0 18px rgba(var(--v-theme-primary), 0.25);
}

.hf-avatar--enemy {
  color: rgb(var(--v-theme-secondary));
  text-shadow: 0 0 18px rgba(var(--v-theme-secondary), 0.22);
}

.hf-body { padding: 18px 24px 10px; }
.hf-narration { font-size: 1.02rem; line-height: 1.4; }
.hf-subtle { opacity: 0.8; }
.hf-vs { opacity: 0.6; font-weight: 700; letter-spacing: 0.08em; }
.hf-hp { margin-top: 10px; font-weight: 600; }
.hf-actions { display: flex; justify-content: center; }
.hf-actions-inner { width: 100%; display: flex; justify-content: center; }
.hf-actions-wrap { flex-wrap: wrap; gap: 10px; }

.hf-food-btn {
  min-width: 190px;
  background: rgba(var(--v-theme-on-surface), 0.04) !important;
}

.hf-weapon-btn {
  position: relative;
  overflow: hidden;
  min-width: 190px;
  background: rgba(var(--v-theme-on-surface), 0.06) !important;
  opacity: 1 !important;
  transition: filter 120ms ease, transform 120ms ease, box-shadow 120ms ease;
}

.hf-weapon-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(var(--v-theme-primary), 0.18);
  transform-origin: left;
  transform: scaleX(var(--hf-weapon-progress, 0));
  transition: transform 50ms linear;
  pointer-events: none;
}

.hf-weapon-btn :deep(.v-btn__content) { position: relative; z-index: 1; }

.hf-weapon-btn:deep(.v-btn--disabled),
.hf-weapon-btn.v-btn--disabled {
  filter: grayscale(0.35) saturate(0.75);
}

.hf-weapon-btn.hf-ready { filter: saturate(1.08); }
.hf-weapon-btn.hf-pulse { animation: hf-ready-pulse 650ms ease-out 1; }

@keyframes hf-ready-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.0); }
  25% { transform: scale(1.03); box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0.22); }
  55% { transform: scale(1.01); box-shadow: 0 0 0 16px rgba(var(--v-theme-primary), 0.10); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.0); }
}

.hf-drops { border: 1px solid rgba(var(--v-theme-on-surface), 0.14); border-radius: 12px; }
.hf-drop-item { min-height: 40px; }
.hf-drop-icon { display: inline-block; width: 18px; text-align: center; opacity: 0.7; }

.hf-empty-drop {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.22);
  border-radius: 12px;
  padding: 12px 14px;
  opacity: 0.85;
}
</style>
