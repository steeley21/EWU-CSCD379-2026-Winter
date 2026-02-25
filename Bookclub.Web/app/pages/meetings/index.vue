<template>
  <div class="meetings-page">

    <!-- Ambient blobs -->
    <div class="meetings-bg" aria-hidden="true">
      <div class="meet-blob meet-blob--1" />
      <div class="meet-blob meet-blob--2" />
    </div>

    <!-- Back nav -->
    <button class="meetings-back-btn" @click="navigateTo('/dashboard')">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Dashboard
    </button>

    <!-- Header -->
    <header class="meetings-header">
      <div class="meetings-eyebrow">
        <span class="eyebrow-dot" />
        Your Schedule
      </div>
      <h1 class="meetings-title">Meetings</h1>
      <p class="meetings-sub">All upcoming and past sessions across your groups</p>
    </header>

    <!-- Stats strip -->
    <div class="meetings-stats">
      <div class="mstat">
        <div class="mstat-value">{{ upcomingMeetings.length }}</div>
        <div class="mstat-label">Upcoming</div>
      </div>
      <div class="mstat-divider" />
      <div class="mstat">
        <div class="mstat-value">{{ pastMeetings.length }}</div>
        <div class="mstat-label">Past</div>
      </div>
      <div class="mstat-divider" />
      <div class="mstat">
        <div class="mstat-value">{{ groupsWithMeetings }}</div>
        <div class="mstat-label">Groups</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="meetings-loading">
      <div class="skeleton-card" v-for="n in 3" :key="n" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="meetings-error">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>

    <!-- Content -->
    <div v-else class="meetings-body">

      <!-- Tabs -->
      <div class="meetings-tabs">
        <button
          class="meetings-tab"
          :class="{ 'meetings-tab--active': tab === 'upcoming' }"
          @click="tab = 'upcoming'"
        >
          Upcoming
          <span v-if="upcomingMeetings.length" class="tab-badge">{{ upcomingMeetings.length }}</span>
        </button>
        <button
          class="meetings-tab"
          :class="{ 'meetings-tab--active': tab === 'past' }"
          @click="tab = 'past'"
        >
          Past
          <span v-if="pastMeetings.length" class="tab-badge tab-badge--muted">{{ pastMeetings.length }}</span>
        </button>
      </div>

      <!-- Upcoming -->
      <div v-if="tab === 'upcoming'">
        <div v-if="upcomingMeetings.length === 0" class="meetings-empty">
          <div class="meetings-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="meetings-empty-text">No upcoming meetings</div>
          <p class="meetings-empty-sub">When a group admin schedules a session, it'll appear here.</p>
        </div>

        <div v-else class="meetings-list">
          <div class="meeting-hero">
            <div class="meeting-hero-label">Next Meeting</div>
            <MeetingCard :meeting="upcomingMeetings[0]" :hero="true" />
          </div>

          <template v-if="upcomingMeetings.length > 1">
            <div class="meetings-section-label">Coming Up</div>
            <div class="meetings-grid">
              <MeetingCard
                v-for="(m, i) in upcomingMeetings.slice(1)"
                :key="m.gsId"
                :meeting="m"
                :style="`animation-delay: ${(i + 1) * 0.06}s`"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Past -->
      <div v-if="tab === 'past'">
        <div v-if="pastMeetings.length === 0" class="meetings-empty">
          <div class="meetings-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="meetings-empty-text">No past meetings yet</div>
        </div>
        <div v-else class="meetings-grid">
          <MeetingCard
            v-for="(m, i) in pastMeetings"
            :key="m.gsId"
            :meeting="m"
            :past="true"
            :style="`animation-delay: ${i * 0.05}s`"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import MeetingCard from '~/components/MeetingCard.vue'
import { groupsService } from '~/services/groupsService'
import type { GroupScheduleDto, GroupSummaryDto } from '~/types/dtos'

definePageMeta({ middleware: 'auth' })

export type RichSchedule = GroupScheduleDto & {
  groupName: string
}

const tab = ref<'upcoming' | 'past'>('upcoming')
const loading = ref(true)
const error = ref('')
const allMeetings = ref<RichSchedule[]>([])

const now = new Date()

const upcomingMeetings = computed(() =>
  allMeetings.value
    .filter(m => new Date(m.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
)

const pastMeetings = computed(() =>
  allMeetings.value
    .filter(m => new Date(m.dateTime) < now)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
)

const groupsWithMeetings = computed(() =>
  new Set(allMeetings.value.map(m => m.groupId)).size
)

onMounted(async () => {
  try {
    const groups: GroupSummaryDto[] = await groupsService.getAll()

    const results = await Promise.allSettled(
      groups.map(g => groupsService.getSchedule(g.groupId).then(schedules =>
        schedules.map(s => ({ ...s, groupName: g.groupName } as RichSchedule))
      ))
    )

    const merged: RichSchedule[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') merged.push(...r.value)
    }
    allMeetings.value = merged
  } catch (e: any) {
    error.value = e?.message ?? 'Could not load meetings.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.meetings-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  position: relative;
  min-height: 100vh;
}

/* ── Background ── */
.meetings-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.meet-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.07;
}
.meet-blob--1 {
  width: 420px; height: 420px;
  background: var(--camel, #a39171);
  top: -100px; right: -100px;
}
.meet-blob--2 {
  width: 320px; height: 320px;
  background: var(--coffee-bean, #6d4c3d);
  bottom: 10%; left: -80px;
}
.meetings-page > * { position: relative; z-index: 1; }

/* ── Back button ── */
.meetings-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-muted, #9e8c7e);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
  transition: color 0.15s, transform 0.15s;
}
.meetings-back-btn svg {
  width: 15px; height: 15px;
  transition: transform 0.15s;
}
.meetings-back-btn:hover {
  color: var(--coffee-bean, #6d4c3d);
}
.meetings-back-btn:hover svg {
  transform: translateX(-3px);
}

/* ── Header ── */
.meetings-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--camel, #a39171);
  margin-bottom: 0.35rem;
}
.eyebrow-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--camel, #a39171);
  display: inline-block;
}
.meetings-title {
  font-family: var(--font-display);
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--coffee-bean, #6d4c3d);
  margin: 0 0 0.3rem;
  line-height: 1.1;
}
.meetings-sub {
  color: var(--text-muted, #9e8c7e);
  font-size: 0.9rem;
  margin: 0 0 1.75rem;
}

/* ── Stats strip ── */
.meetings-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 18px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.75rem;
}
.mstat { text-align: center; flex: 1; }
.mstat-value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--coffee-bean, #6d4c3d);
  line-height: 1;
  margin-bottom: 0.2rem;
}
.mstat-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted, #9e8c7e);
}
.mstat-divider {
  width: 1px;
  height: 2.5rem;
  background: var(--border, #e8ddd5);
}

/* ── Tabs ── */
.meetings-tabs {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
  border-bottom: 1.5px solid var(--border, #e8ddd5);
}
.meetings-tab {
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted, #9e8c7e);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.55rem 1rem 0.7rem;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1.5px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: color 0.15s, border-color 0.15s;
}
.meetings-tab--active {
  color: var(--coffee-bean, #6d4c3d);
  border-bottom-color: var(--coffee-bean, #6d4c3d);
}
.tab-badge {
  font-size: 0.7rem;
  font-weight: 800;
  background: var(--coffee-bean, #6d4c3d);
  color: #fff;
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  line-height: 1.5;
}
.tab-badge--muted {
  background: var(--border, #e8ddd5);
  color: var(--text-muted, #9e8c7e);
}

/* ── Hero ── */
.meeting-hero { margin-bottom: 1.5rem; }
.meeting-hero-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--camel, #a39171);
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.meeting-hero-label::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 2px;
  background: var(--camel, #a39171);
  border-radius: 2px;
}
.meetings-section-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted, #9e8c7e);
  margin-bottom: 0.75rem;
}

/* ── Grid ── */
.meetings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

/* ── Empty ── */
.meetings-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted, #9e8c7e);
}
.meetings-empty-icon {
  width: 52px; height: 52px;
  margin: 0 auto 1rem;
  color: var(--pale-oak, #dcc9b6);
}
.meetings-empty-icon svg { width: 100%; height: 100%; }
.meetings-empty-text {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--coffee-bean, #6d4c3d);
  margin-bottom: 0.4rem;
}
.meetings-empty-sub { font-size: 0.85rem; }

/* ── Skeletons ── */
.skeleton-card {
  height: 160px;
  background: linear-gradient(90deg, var(--border, #e8ddd5) 25%, rgba(255,255,255,0.4) 50%, var(--border, #e8ddd5) 75%);
  background-size: 200% 100%;
  border-radius: 20px;
  margin-bottom: 0.75rem;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Error ── */
.meetings-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
}
.meetings-error svg { width: 18px; height: 18px; flex-shrink: 0; }
</style>