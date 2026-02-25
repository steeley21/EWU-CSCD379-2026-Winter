<template>
  <div class="gp-schedule-wrap">

    <!-- ── Next Meeting Card ── -->
    <v-card class="bc-card" rounded="lg">
      <div class="gp-head">
        <div>
          <div class="gp-card-title">Next Meeting</div>
          <div class="gp-sub">Your group's upcoming session</div>
        </div>
        <button class="gp-btn" type="button" @click="$emit('add')">+ Add meeting</button>
      </div>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />

        <div v-else-if="error" class="gp-error">{{ error }}</div>

        <div v-else-if="!next" class="gp-empty">
          <div class="gp-muted">No meeting scheduled yet.</div>
          <div class="gp-muted gp-small">Add a meeting to see it here.</div>
        </div>

        <div v-else class="gp-next">
          <div class="gp-date-tile" aria-hidden="true">
            <div class="gp-date-month">{{ nextMonth }}</div>
            <div class="gp-date-day">{{ nextDay }}</div>
          </div>

          <div class="gp-next-body">
            <div class="gp-next-title">{{ nextPretty }}</div>
            <div class="gp-muted gp-small">
              {{ next.location ? next.location : 'Location TBD' }}
              <span v-if="next.duration"> · {{ next.duration }} min</span>
            </div>

            <div v-if="currentBook" class="gp-book-callout">
              <div class="gp-book-label">Current book</div>
              <div class="gp-book-title">{{ String(currentBook.title ?? 'Untitled') }}</div>
              <div class="gp-muted gp-small">
                {{ currentBook.authorFirst ?? '' }} {{ currentBook.authorLast ?? '' }}
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- ── Calendar Grid Card ── -->
    <v-card class="bc-card" rounded="lg" style="margin-top: 1.25rem;">
      <div class="gp-head">
        <div>
          <div class="gp-card-title">Schedule</div>
          <div class="gp-sub">{{ calendarMonthLabel }}</div>
        </div>
        <div class="gp-cal-nav">
          <button class="gp-nav-btn" type="button" @click="prevMonth" aria-label="Previous month">‹</button>
          <button class="gp-nav-btn" type="button" @click="nextMonth" aria-label="Next month">›</button>
        </div>
      </div>

      <v-card-text class="pa-3">
        <!-- Day-of-week headers -->
        <div class="gp-cal-grid gp-cal-headers">
          <div v-for="d in dayHeaders" :key="d" class="gp-cal-dow">{{ d }}</div>
        </div>

        <!-- Calendar cells -->
        <div class="gp-cal-grid">
          <div
            v-for="(cell, i) in calendarCells"
            :key="i"
            class="gp-cal-cell"
            :class="{
              'gp-cal-cell--faded': !cell.inMonth,
              'gp-cal-cell--today': cell.isToday,
              'gp-cal-cell--has-meeting': cell.meetings.length > 0,
            }"
          >
            <span class="gp-cal-day-num">{{ cell.day }}</span>

            <div v-if="cell.meetings.length" class="gp-cal-dots">
              <div
                v-for="m in cell.meetings"
                :key="m.gsId"
                class="gp-cal-meeting-chip"
                :title="formatChipTitle(m)"
              >
                {{ formatChipTime(m) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming list below grid -->
        <template v-if="upcoming.length">
          <div class="gp-divider" />
          <div class="gp-list">
            <div v-for="m in upcoming" :key="keyOf(m)" class="gp-row">
              <div class="gp-row-left">
                <div class="gp-row-date">{{ formatRow(m) }}</div>
                <div class="gp-muted gp-small">
                  {{ m.location || 'Location TBD' }}
                  <span v-if="m.duration"> · {{ m.duration }} min</span>
                </div>
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
        </template>

        <div v-else-if="!loading" class="gp-muted gp-small" style="margin-top: 0.75rem;">
          No upcoming meetings this month.
        </div>
      </v-card-text>
    </v-card>

  </div>
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

// ── Next meeting helpers ──────────────────────────────────────

function parseDt(dateTime?: string | null) {
  const t = dateTime ? Date.parse(String(dateTime)) : NaN
  return Number.isFinite(t) ? new Date(t) : null
}

const nextDate = computed(() => parseDt(props.next?.dateTime))

const nextMonth = computed(() =>
  nextDate.value ? nextDate.value.toLocaleString(undefined, { month: 'short' }) : '—'
)
const nextDay = computed(() =>
  nextDate.value ? String(nextDate.value.getDate()) : '—'
)
const nextPretty = computed(() =>
  nextDate.value
    ? nextDate.value.toLocaleString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : 'Meeting'
)

// ── Calendar state ────────────────────────────────────────────

const today = new Date()
const viewYear  = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-based

const calendarMonthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleString(undefined, { month: 'long', year: 'numeric' })
)

function goToPrevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function goToNextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalCell {
  day: number
  inMonth: boolean
  isToday: boolean
  meetings: GroupScheduleDto[]
}

const calendarCells = computed<CalCell[]>(() => {
  const year  = viewYear.value
  const month = viewMonth.value

  const firstDay = new Date(year, month, 1).getDay()   // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  // index meetings by date string "Y-M-D"
  const byDay = new Map<string, GroupScheduleDto[]>()
  for (const m of props.upcoming) {
    const d = parseDt(m.dateTime)
    if (!d) continue
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(m)
  }
  // also include next meeting
  if (props.next) {
    const d = parseDt(props.next.dateTime)
    if (d) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!byDay.has(key)) byDay.set(key, [])
      const arr = byDay.get(key)!
      if (!arr.find(x => x.gsId === props.next!.gsId)) arr.unshift(props.next)
    }
  }

  const cells: CalCell[] = []

  // Leading days from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    cells.push({ day, inMonth: false, isToday: false, meetings: [] })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`
    const isToday = key === todayStr
    cells.push({ day: d, inMonth: true, isToday, meetings: byDay.get(key) ?? [] })
  }

  // Trailing days to fill last row
  const remainder = cells.length % 7
  if (remainder !== 0) {
    for (let d = 1; d <= 7 - remainder; d++) {
      cells.push({ day: d, inMonth: false, isToday: false, meetings: [] })
    }
  }

  return cells
})

// ── Row / chip formatters ─────────────────────────────────────

function formatRow(s: GroupScheduleDto) {
  const d = parseDt(s.dateTime)
  if (!d) return 'Meeting'
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function formatChipTime(s: GroupScheduleDto) {
  const d = parseDt(s.dateTime)
  return d ? d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'
}

function formatChipTitle(s: GroupScheduleDto) {
  const d = parseDt(s.dateTime)
  if (!d) return 'Meeting'
  return d.toLocaleString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }) + (s.location ? ` · ${s.location}` : '')
}

function keyOf(s: GroupScheduleDto) {
  return String(s.gsId ?? s.dateTime ?? Math.random())
}
</script>

<style scoped>
.gp-schedule-wrap { display: flex; flex-direction: column; }

/* ── Shared head ── */
.gp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.25rem;
}
.gp-card-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}
.gp-sub { color: var(--text-muted); font-size: 0.9rem; }

/* ── Buttons ── */
.gp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--bg);
  background: var(--coffee-bean);
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background var(--ease), transform var(--ease), box-shadow var(--ease);
  box-shadow: 0 3px 12px rgba(109, 76, 61, 0.2);
}
.gp-btn:hover {
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(163, 145, 113, 0.35);
}
.gp-btn-ghost {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--coffee-bean);
  background: transparent;
  border: 1px solid var(--pale-oak);
  border-radius: var(--radius-pill);
  padding: 0.42rem 0.85rem;
  cursor: pointer;
  transition: border-color var(--ease), background var(--ease);
}
.gp-btn-ghost:hover {
  border-color: var(--camel);
  background: rgba(220, 201, 182, 0.2);
}

/* ── Nav buttons ── */
.gp-cal-nav { display: flex; gap: 0.4rem; }
.gp-nav-btn {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  font-size: 1.1rem;
  color: var(--coffee-bean);
  background: transparent;
  border: 1px solid var(--pale-oak);
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--ease), border-color var(--ease);
}
.gp-nav-btn:hover {
  background: rgba(220, 201, 182, 0.3);
  border-color: var(--camel);
}

/* ── Next meeting ── */
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
.gp-book-title { font-weight: 700; color: var(--coffee-bean); }

/* ── Calendar grid ── */
.gp-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}
.gp-cal-headers { margin-bottom: 4px; }
.gp-cal-dow {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 0.2rem 0;
}
.gp-cal-cell {
  min-height: 60px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px 5px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background var(--ease);
}
.gp-cal-cell--faded {
  opacity: 0.35;
}
.gp-cal-cell--today {
  border-color: var(--camel);
  background: rgba(220, 201, 182, 0.12);
}
.gp-cal-cell--today .gp-cal-day-num {
  background: var(--coffee-bean);
  color: var(--bg);
  border-radius: 50%;
  width: 22px; height: 22px;
  display: grid; place-items: center;
}
.gp-cal-cell--has-meeting {
  background: rgba(220, 201, 182, 0.18);
}
.gp-cal-day-num {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--coffee-bean);
  line-height: 1;
}
.gp-cal-dots { display: flex; flex-direction: column; gap: 2px; }
.gp-cal-meeting-chip {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--bg);
  background: var(--coffee-bean);
  border-radius: 6px;
  padding: 1px 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

/* ── Upcoming list ── */
.gp-divider {
  height: 1px;
  background: linear-gradient(to right, var(--pale-oak), transparent);
  margin: 1rem 0;
}
.gp-list { display: flex; flex-direction: column; gap: 0.75rem; }
.gp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
}
.gp-row-date {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--coffee-bean);
}

/* ── Utility ── */
.gp-muted { color: var(--text-muted); }
.gp-small { font-size: 0.85rem; }
.gp-empty { display: flex; flex-direction: column; gap: 0.25rem; }
.gp-error {
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
}
</style>