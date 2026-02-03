<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)"
    max-width="520"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 text-center">Fight!</v-card-title>

      <v-card-text class="text-body-2">
        <div>You encountered an enemy.</div>
        <div class="mt-2">Enemy ID: {{ enemyId ?? '—' }}</div>

        <!-- HUD (fight-only) -->
        <div class="d-flex justify-center ga-2 mt-4 flex-wrap">
          <v-chip label size="small">HP {{ hp }} / {{ maxHp }}</v-chip>
          <v-chip label size="small">Enemy HP {{ enemyHp }} / {{ enemyMaxHp }}</v-chip>
          <v-chip label size="small">Infected {{ infected }} / {{ maxEnemies }}</v-chip>
        </div>

        <div class="text-center mt-3">
          Enemy hits for {{ enemyDmg }} every {{ enemyHitIntervalMs / 1000 }}s
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="outlined" @click="$emit('run')">Run</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="text" @click="$emit('attack')">
          Hit - {{ playerDmg }} dmg
        </v-btn>
      </v-card-actions>

      <!-- IMPORTANT:
           I recommend removing "Close" now.
           If you keep it, it should behave like Run (not a free dismiss). -->
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
type Props = {
  modelValue: boolean
  enemyId: number | null

  // player HUD
  hp: number
  maxHp: number
  infected: number
  maxEnemies: number

  // enemy HUD + combat numbers (from rules/state)
  enemyHp: number
  enemyMaxHp: number
  playerDmg: number
  enemyDmg: number
  enemyHitIntervalMs: number
}

defineProps<Props>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'attack'): void
  (e: 'run'): void
}>()
</script>
