<template>
  <v-card class="bc-card" rounded="lg" variant="outlined">
    <v-card-text>
      <div class="bre-row">
        <div class="bre-label">Stars</div>
        <v-rating
          v-model="stars"
          half-increments
          density="compact"
        />
      </div>

      <div class="bre-row mt-2">
        <div class="bre-label">Rating</div>
        <v-text-field
          v-model.number="rating"
          type="number"
          step="0.01"
          min="0"
          max="5"
          density="comfortable"
          variant="outlined"
          hide-details
        />
      </div>

      <div class="bre-hint">
        Tip: click stars for quick half-steps, or type any decimal (0–5).
      </div>

      <v-textarea
        v-model="comment"
        class="mt-3"
        label="Comment (optional)"
        variant="outlined"
        density="comfortable"
        auto-grow
        rows="2"
      />

      <v-alert v-if="localError" type="error" variant="tonal" class="mt-2">
        {{ localError }}
      </v-alert>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="canDelete"
        variant="text"
        :disabled="saving"
        @click="$emit('delete')"
      >
        Delete
      </v-btn>
      <v-btn
        color="primary"
        :loading="saving"
        @click="onSave"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { UpsertGroupBookReviewDto } from '~/types/dtos'

const props = defineProps<{
  initialRating: number | null | undefined
  initialComment: string | null | undefined
  saving: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  (e: 'save', payload: UpsertGroupBookReviewDto): void
  (e: 'delete'): void
}>()

const rating = ref<number>(props.initialRating ?? 0)
const stars = ref<number>(props.initialRating ?? 0)
const comment = ref<string>(props.initialComment ?? '')
const localError = ref('')

watch(
  () => [props.initialRating, props.initialComment],
  () => {
    rating.value = props.initialRating ?? 0
    stars.value = props.initialRating ?? 0
    comment.value = props.initialComment ?? ''
    localError.value = ''
  }
)

watch(stars, (v) => {
  // stars produces half-steps; keep numeric input in sync
  rating.value = v
})

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, n))
}

function onSave() {
  localError.value = ''
  const r = clamp(Number(rating.value))

  if (r < 0 || r > 5) {
    localError.value = 'Rating must be between 0 and 5.'
    return
  }

  emit('save', {
    rating: r,
    comment: (comment.value ?? '').trim() || null,
  })
}
</script>

<style scoped>
.bre-row{
  display:flex;
  align-items:center;
  gap:0.75rem;
}
.bre-label{
  width: 64px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  font-weight: 700;
}
.bre-hint{
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>