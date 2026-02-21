<template>
  <v-card class="bc-card" rounded="lg">
    <v-card-title class="gp-card-title">Next Meeting</v-card-title>
    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />

      <div v-else-if="error" class="gp-error">{{ error }}</div>

      <div v-else-if="!next">
        <div class="gp-muted">No meeting scheduled yet.</div>
        <div class="gp-muted gp-small">Add a schedule to see it here.</div>
      </div>

      <div v-else class="gp-next">
        <div class="gp-date-tile" aria-hidden="true">
          <div class="gp-date-month">{{ month }}</div>
          <div class="gp-date-day">{{ day }}</div>
        </div>

        <div class="gp-next-body">
          <div class="gp-next-title">{{ pretty }}</div>
          <div class="gp-muted gp-small">
            {{ next.dateTime ? `Scheduled` : `Schedule item` }}
          </div>

          <div v-if="currentBook" class="gp-book-callout">
            <div class="gp-book-label">Current book</div>
            <div class="gp-book-title">{{ String(currentBook.title ?? 'Untitled') }}</div>
            <div class="gp-muted gp-small">{{ String(currentBook.author ?? 'Unknown author') }}</div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto, GroupScheduleDto } from '~/types/dtos'

const props = defineProps<{
  next: GroupScheduleDto | null
  currentBook: BookDto | null
  loading: boolean
  error: string
}>()

const dt = computed(() => {
  const w = props.next?.dateTime
  const t = w ? Date.parse(String(w)) : NaN
  return Number.isFinite(t) ? new Date(t) : null
})

const month = computed(() => dt.value ? dt.value.toLocaleString(undefined, { month: 'short' }) : '—')
const day = computed(() => dt.value ? String(dt.value.getDate()) : '—')
const pretty = computed(() => dt.value
  ? dt.value.toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  : 'Meeting'
)
</script>

<style scoped>
.gp-card-title {
  font-family: var(--font-display);
  font-weight: 700;
}
.gp-next {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 1rem;
  align-items: start;
}
.gp-date-tile {
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 14px;
  overflow: hidden;
  text-align: center;
}
.gp-date-month {
  background: var(--coffee-bean);
  color: var(--bg);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.35rem 0.25rem;
}
.gp-date-day {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--coffee-bean);
  padding: 0.45rem 0.25rem 0.55rem;
}
.gp-next-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}
.gp-book-callout {
  margin-top: 0.9rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid var(--pale-oak);
  background: rgba(220, 201, 182, 0.25);
}
.gp-book-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 0.25rem;
}
.gp-book-title {
  font-weight: 700;
  color: var(--coffee-bean);
}
.gp-muted { color: var(--text-muted); }
.gp-small { font-size: 0.85rem; }
.gp-error {
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
}
</style>