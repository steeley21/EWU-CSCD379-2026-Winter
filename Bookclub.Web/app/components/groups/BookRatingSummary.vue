<template>
  <div class="brs">
    <v-rating
      :model-value="displayStars"
      readonly
      half-increments
      density="compact"
      size="18"
    />
    <div class="brs-meta">
      <span class="brs-num">{{ avgLabel }}</span>
      <span class="brs-count">({{ count }} review{{ count === 1 ? '' : 's' }})</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  avg: number | null | undefined
  count: number
}>()

const displayStars = computed(() => {
  const v = props.avg
  if (v == null || !Number.isFinite(v)) return 0
  return Math.max(0, Math.min(5, v))
})

const avgLabel = computed(() => {
  const v = props.avg
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toFixed(2)
})
</script>

<style scoped>
.brs{
  display:flex;
  align-items:center;
  gap:0.6rem;
}
.brs-meta{
  display:flex;
  align-items:baseline;
  gap:0.4rem;
  color: var(--text-muted);
}
.brs-num{
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--coffee-bean);
}
.brs-count{
  font-size: 0.9rem;
}
</style>