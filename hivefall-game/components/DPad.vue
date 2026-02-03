<template>
  <div class="dp-wrap" :style="wrapStyle" role="group" aria-label="Movement controls">
    <div class="dp-row">
      <v-btn class="dp-btn" icon :disabled="disabled" aria-label="Move up" @click.stop="onUp">
        <v-icon icon="mdi-chevron-up" />
      </v-btn>
    </div>

    <div class="dp-row dp-mid">
      <v-btn class="dp-btn" icon :disabled="disabled" aria-label="Move left" @click.stop="onLeft">
        <v-icon icon="mdi-chevron-left" />
      </v-btn>

      <div class="dp-center" aria-hidden="true" />

      <v-btn class="dp-btn" icon :disabled="disabled" aria-label="Move right" @click.stop="onRight">
        <v-icon icon="mdi-chevron-right" />
      </v-btn>
    </div>

    <div class="dp-row">
      <v-btn class="dp-btn" icon :disabled="disabled" aria-label="Move down" @click.stop="onDown">
        <v-icon icon="mdi-chevron-down" />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Props = {
  disabled?: boolean
  onUp: () => void
  onDown: () => void
  onLeft: () => void
  onRight: () => void

  btnSizePx?: number
  gapPx?: number
  padPx?: number
}

const props = withDefaults(defineProps<Props>(), {
  btnSizePx: 48,
  gapPx: 10,
  padPx: 10,
})

const wrapStyle = computed(() => ({
  '--dp-btn': `${props.btnSizePx}px`,
  '--dp-gap': `${props.gapPx}px`,
  '--dp-pad': `${props.padPx}px`,
}))
</script>

<style scoped>
.dp-wrap {
  display: grid;
  gap: var(--dp-gap);
  padding: var(--dp-pad);
  border-radius: 12px;
  border: 1px solid rgba(127, 127, 127, 0.25);
  background: rgba(127, 127, 127, 0.06);
  width: fit-content;
  touch-action: manipulation;
}

.dp-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--dp-gap);
}

.dp-mid {
  justify-content: space-between;
}

.dp-center {
  width: var(--dp-btn);
  height: var(--dp-btn);
}

.dp-btn {
  width: var(--dp-btn);
  height: var(--dp-btn);
  min-width: var(--dp-btn);
  border-radius: 14px;
}
</style>
