<template>
  <v-dialog
    :model-value="modelValue"
    max-width="420"
    persistent
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <v-card>
      <v-card-title class="text-h6 text-center">Fight!</v-card-title> 

      <v-card-text class="text-body-2">
        <div>You encountered an enemy.</div>
        <div v-if="enemyId != null" class="mt-2">
          Enemy ID: <strong>{{ enemyId }}</strong>
        </div>

        <div class="mt-3">
          (Combat resolution is next — for now this is a UI placeholder.)
        </div>
      </v-card-text>

      <v-card-actions class="ga-2">
        <v-btn variant="outlined" @click="onRun">Run</v-btn>
        <v-spacer />
        <v-btn color="primary" @click="onAttack">Attack</v-btn>
      </v-card-actions>

      <v-card-actions class="pt-0">
        <v-btn variant="text" block @click="onClose">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
type Props = {
  modelValue: boolean
  enemyId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'attack', enemyId: number | null): void
  (e: 'run', enemyId: number | null): void
  (e: 'close'): void
}>()

function onAttack(): void {
  emit('attack', props.enemyId)
}

function onRun(): void {
  emit('run', props.enemyId)
}

function onClose(): void {
  emit('close')
  emit('update:modelValue', false)
}

</script>
