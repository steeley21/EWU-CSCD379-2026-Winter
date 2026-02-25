<template>
  <div class="brl">
    <div v-if="!reviews.length" class="gp-muted">
      No reviews yet.
    </div>

    <div v-else class="brl-list">
      <v-card
        v-for="r in reviews"
        :key="r.reviewId"
        class="bc-card"
        rounded="lg"
        variant="outlined"
      >
        <v-card-text>
          <div class="brl-head">
            <div class="brl-name">{{ r.fullName }}</div>

            <div class="brl-rating">
              <v-rating :model-value="r.rating" readonly half-increments density="compact" size="18" />
              <span class="brl-num">{{ r.rating.toFixed(2) }}</span>
            </div>
          </div>

          <div v-if="r.comment" class="brl-comment">
            {{ r.comment }}
          </div>

          <div class="brl-meta">
            Updated {{ formatDate(r.updatedAt) }}
          </div>

          <div class="brl-actions" v-if="canModerate">
            <v-btn
              variant="text"
              size="small"
              @click="$emit('moderate-delete', r.reviewId)"
            >
              Delete
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GroupBookReviewDto } from '~/types/dtos'

defineProps<{
  reviews: GroupBookReviewDto[]
  canModerate: boolean
}>()

defineEmits<{
  (e: 'moderate-delete', reviewId: number): void
}>()

function formatDate(iso: string): string {
  const t = Date.parse(String(iso))
  if (!Number.isFinite(t)) return String(iso)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(t))
}
</script>

<style scoped>
.brl-list{
  display:flex;
  flex-direction:column;
  gap:0.8rem;
}
.brl-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:1rem;
}
.brl-name{
  font-family: var(--font-display);
  font-weight: 900;
  color: var(--coffee-bean);
}
.brl-rating{
  display:flex;
  align-items:center;
  gap:0.4rem;
  white-space:nowrap;
}
.brl-num{
  color: var(--text-muted);
  font-size: 0.9rem;
}
.brl-comment{
  margin-top: 0.5rem;
  color: var(--text-base);
  white-space: pre-wrap;
}
.brl-meta{
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.brl-actions{
  margin-top: 0.25rem;
  display:flex;
  justify-content:flex-end;
}
</style>