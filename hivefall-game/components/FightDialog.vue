<template>
  <v-dialog :model-value="modelValue" max-width="520" persistent>
    <v-card>
      <v-card-title class="text-h6 text-center">Fight!</v-card-title>

      <v-card-text class="text-body-2">
        <div>You encountered an enemy.</div>
        <div class="mt-2">Enemy ID: {{ enemyId ?? '—' }}</div>

        <!-- HUD (fight-only) -->
        <div class="d-flex justify-center ga-2 mt-4">
          <v-chip label size="small">HP {{ hp }} / {{ maxHp }}</v-chip>
          <v-chip label size="small">Infected {{ infected }} / {{ maxEnemies }}</v-chip>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="outlined" @click="$emit('run')">Run</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="text" @click="$emit('attack')">Attack</v-btn>
      </v-card-actions>

      <v-card-actions class="pt-0">
        <v-btn block variant="text" @click="$emit('close')">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
type Props = {
  modelValue: boolean
  enemyId: number | null

  hp: number
  maxHp: number
  infected: number
  maxEnemies: number
}

defineProps<Props>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'attack'): void
  (e: 'run'): void
  (e: 'close'): void
}>()
</script>
