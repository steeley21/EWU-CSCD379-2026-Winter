<template>
  <v-card class="bc-card" rounded="lg">
    <div class="gp-head">
      <div>
        <div class="gp-title">Schedule</div>
        <div class="gp-sub">Next meeting and upcoming dates</div>
      </div>

      <button class="gp-btn" type="button" @click="$emit('add')">
        + Add meeting
      </button>
    </div>

    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />

      <div v-else-if="error" class="gp-error">{{ error }}</div>

      <div v-else>
        <!-- Next meeting (calendar tile) -->
        <div v-if="next" class="gp-next">
          <div class="gp-date-tile" aria-hidden="true">
            <div class="gp-date-month">{{ nextMonth }}</div>
            <div class="gp-date-day">{{ nextDay }}</div>
          </div>

          <div class="gp-next-body">
            <div class="gp-next-title">{{ nextPretty }}</div>
            <div class="gp-muted gp-small">
              {{ currentBook ? 'Current book:' : 'No book selected yet.' }}
              <span v-if="currentBook" class="gp-book-inline">
                {{ String(currentBook.title ?? 'Untitled') }}
              </span>
            </div>
          </div>
        </div>

        <div v-else class="gp-muted">
          No meeting scheduled yet.
        </div>

        <div class="gp-divider" />

        <!-- Upcoming list -->
        <div v-if="upcoming.length" class="gp-list">
          <div v-for="m in upcoming" :key="keyOf(m)" class="gp-row">
            <div class="gp-row-left">
              <div class="gp-row-date">{{ formatRow(m) }}</div>
              <div class="gp-muted gp-small">{{ m.dateTime ? 'Scheduled' : 'Schedule item' }}</div>
            </div>

            <button
              v-if="m.gsId"
              class="gp-btn-ghost"
              type="button"
              @click="$emit('delete', m.gsId)"
              title="Delete meeting"
            >
              Delete
            </button>
          </div>
        </div>

        <div v-else class="gp-muted gp-small">
          No upcoming meetings.
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { BookDto, GroupScheduleDto } from '~/types/dtos'

defineEmits<{
  (e: 'add'): void
  (e: 'delete', gsId: number): void
}>()

const props = defineProps<{
  next: GroupScheduleDto | null
  upcoming: GroupScheduleDto[]
  currentBook: BookDto | null
  loading: boolean
  error: string
}>()

function dt(dateTime?: string) {
  const t = dateTime ? Date.parse(String(dateTime)) : NaN
  return Number.isFinite(t) ? new Date(t) : null
}

const nextDate = computed(() => dt(props.next?.dateTime))

const nextMonth = computed(() =>
  nextDate.value ? nextDate.value.toLocaleString(undefined, { month: 'short' }) : '—'
)
const nextDay = computed(() =>
  nextDate.value ? String(nextDate.value.getDate()) : '—'
)
const nextPretty = computed(() =>
  nextDate.value
    ? nextDate.value.toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Meeting'
)

function formatRow(s: GroupScheduleDto) {
  const d = dt(s.dateTime)
  if (!d) return 'Meeting'
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function keyOf(s: GroupScheduleDto) {
  return String(s.gsId ?? s.dateTime ?? Math.random())
}
</script>

<style scoped>
.gp-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:1rem;
  padding: 1rem 1rem 0.25rem;
}
.gp-title{
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}
.gp-sub{
  color: var(--text-muted);
  font-size: 0.9rem;
}

.gp-btn{
  display:inline-flex;
  align-items:center;
  gap:0.4rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--bg);
  background: var(--coffee-bean);
  border:none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1rem;
  cursor:pointer;
  transition: background var(--ease), transform var(--ease), box-shadow var(--ease);
  box-shadow: 0 3px 12px rgba(109, 76, 61, 0.2);
}
.gp-btn:hover{
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(163, 145, 113, 0.35);
}

.gp-btn-ghost{
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--coffee-bean);
  background: transparent;
  border: 1px solid var(--pale-oak);
  border-radius: var(--radius-pill);
  padding: 0.42rem 0.85rem;
  cursor:pointer;
  transition: border-color var(--ease), background var(--ease);
}
.gp-btn-ghost:hover{
  border-color: var(--camel);
  background: rgba(220, 201, 182, 0.2);
}

.gp-next{
  display:grid;
  grid-template-columns: 64px 1fr;
  gap: 1rem;
  align-items:start;
}
.gp-date-tile{
  border:1px solid var(--border);
  background: var(--bg);
  border-radius: 14px;
  overflow:hidden;
  text-align:center;
}
.gp-date-month{
  background: var(--coffee-bean);
  color: var(--bg);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.35rem 0.25rem;
}
.gp-date-day{
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--coffee-bean);
  padding: 0.45rem 0.25rem 0.55rem;
}
.gp-next-title{
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}
.gp-book-inline{ font-weight: 700; margin-left: 0.25rem; }

.gp-divider{
  height:1px;
  background: linear-gradient(to right, var(--pale-oak), transparent);
  margin: 1rem 0;
}

.gp-list{ display:flex; flex-direction:column; gap:0.75rem; }
.gp-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
}
.gp-row-date{
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--coffee-bean);
}
.gp-muted{ color: var(--text-muted); }
.gp-small{ font-size: 0.85rem; }

.gp-error{
  color:#b94a48;
  background:#fff5f5;
  border:1px solid rgba(185,74,72,0.25);
  border-radius:14px;
  padding:0.75rem 0.9rem;
}
</style>