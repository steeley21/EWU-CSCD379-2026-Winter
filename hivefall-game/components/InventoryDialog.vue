<!-- components/InventoryDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="(v) => $emit('update:modelValue', v)"
    max-width="560"
  >
    <v-card class="hf-card">
      <v-card-title class="text-h6 text-center">Inventory</v-card-title>

      <v-card-text>
        <div class="mb-3">
          <strong>Food:</strong> {{ food }}
        </div>

        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-left">Weapon</th>
              <th class="text-left">Damage</th>
              <th class="text-left">Qty</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="w in items" :key="w.id">
              <td>{{ w.name }}</td>
              <td>{{ w.dmg }}</td>
              <td>{{ w.qty == null ? '∞' : w.qty }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="tonal" color="primary" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { WeaponId } from '../game/hivefallRules'

export type InventoryRowVm = {
  id: WeaponId
  name: string
  dmg: number
  qty: number | null
}

defineProps<{
  modelValue: boolean
  food: number
  items: InventoryRowVm[]
}>()

defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()
</script>

<style scoped>
.hf-card {
  border-radius: 14px;
}
</style>
