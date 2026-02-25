<template>
  <div
    class="mcard"
    :class="{
      'mcard--hero': hero,
      'mcard--past': past,
    }"
  >
    <!-- Accent bar -->
    <div class="mcard-accent" />

    <div class="mcard-inner">
      <!-- Date block -->
      <div class="mcard-datecol">
        <div class="mcard-month">{{ month }}</div>
        <div class="mcard-day">{{ day }}</div>
        <div class="mcard-year">{{ year }}</div>
      </div>

      <div class="mcard-content">
        <!-- Group pill -->
        <div class="mcard-group-pill">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {{ meeting.groupName }}
        </div>

        <!-- Book title -->
        <div class="mcard-book">{{ meeting.book?.title ?? 'Untitled' }}</div>
        <div class="mcard-author">{{ bookAuthor }}</div>

        <!-- Meta row -->
        <div class="mcard-meta">
          <span class="mcard-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {{ timeStr }}
            <span v-if="meeting.duration" class="mcard-duration">· {{ durationStr }}</span>
          </span>

          <span v-if="meeting.location" class="mcard-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{ meeting.location }}
          </span>
        </div>

        <!-- Countdown badge (upcoming only) -->
        <div v-if="!past && countdown" class="mcard-countdown" :class="{ 'mcard-countdown--soon': isSoon }">
          {{ countdown }}
        </div>

        <!-- Past badge -->
        <div v-if="past" class="mcard-past-badge">Completed</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RichSchedule } from '~/pages/meetings/index.vue'

const props = defineProps<{
  meeting: RichSchedule
  hero?: boolean
  past?: boolean
}>()

const dt = computed(() => new Date(props.meeting.dateTime))

const month = computed(() =>
  dt.value.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()
)
const day   = computed(() => dt.value.getDate())
const year  = computed(() => dt.value.getFullYear())

const timeStr = computed(() =>
  dt.value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
)

const durationStr = computed(() => {
  const d = props.meeting.duration
  if (!d) return ''
  if (d < 60) return `${d}m`
  const h = Math.floor(d / 60)
  const m = d % 60
  return m ? `${h}h ${m}m` : `${h}h`
})

const bookAuthor = computed(() => {
  const b = props.meeting.book
  if (!b) return ''
  if (b.author) return b.author
  const parts = [b.authorFirst, b.authorLast].filter(Boolean)
  return parts.length ? parts.join(' ') : ''
})

const countdown = computed(() => {
  if (props.past) return ''
  const diff = dt.value.getTime() - Date.now()
  if (diff < 0) return ''
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)   return `In ${mins}m`
  if (hours < 24)  return `In ${hours}h`
  if (days === 1)  return 'Tomorrow'
  if (days < 7)    return `In ${days} days`
  if (days < 30)   return `In ${Math.floor(days / 7)} wk`
  return `In ${Math.floor(days / 30)} mo`
})

const isSoon = computed(() => {
  const diff = dt.value.getTime() - Date.now()
  return diff > 0 && diff < 86400000 // within 24h
})
</script>

<style scoped>
.mcard {
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
  animation: cardIn 0.28s ease both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mcard:hover {
  border-color: var(--camel, #a39171);
  box-shadow: 0 6px 28px rgba(109, 76, 61, 0.1);
  transform: translateY(-2px);
}

/* Hero variant */
.mcard--hero {
  border-color: var(--camel, #a39171);
  box-shadow: 0 8px 36px rgba(163, 145, 113, 0.18);
}
.mcard--hero .mcard-datecol {
  background: var(--coffee-bean, #6d4c3d);
  color: #fff;
}
.mcard--hero .mcard-month { color: rgba(255,255,255,0.65); }
.mcard--hero .mcard-year  { color: rgba(255,255,255,0.5); }

/* Past variant */
.mcard--past {
  opacity: 0.75;
}
.mcard--past .mcard-accent { background: var(--border, #e8ddd5); }
.mcard--past .mcard-datecol {
  background: rgba(220, 201, 182, 0.3);
}

/* Accent bar */
.mcard-accent {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, var(--camel, #a39171), var(--coffee-bean, #6d4c3d));
  border-radius: 4px 0 0 4px;
}

.mcard-inner {
  display: flex;
  gap: 0;
}

/* Date column */
.mcard-datecol {
  flex-shrink: 0;
  width: 68px;
  background: rgba(220, 201, 182, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 0.5rem;
  border-right: 1px solid var(--border, #e8ddd5);
  gap: 0.05rem;
}
.mcard-month {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--camel, #a39171);
  text-transform: uppercase;
}
.mcard-day {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 900;
  color: var(--coffee-bean, #6d4c3d);
  line-height: 1;
}
.mcard-year {
  font-size: 0.68rem;
  color: var(--text-muted, #9e8c7e);
  font-weight: 600;
}

/* Content */
.mcard-content {
  flex: 1;
  padding: 1rem 1.1rem 0.9rem;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.mcard-group-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--camel, #a39171);
  background: rgba(163, 145, 113, 0.12);
  border-radius: 999px;
  padding: 0.2rem 0.65rem 0.2rem 0.45rem;
  width: fit-content;
  margin-bottom: 0.15rem;
}
.mcard-group-pill svg {
  width: 11px; height: 11px;
  flex-shrink: 0;
}

.mcard-book {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.02rem;
  color: var(--coffee-bean, #6d4c3d);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mcard-author {
  font-size: 0.78rem;
  color: var(--text-muted, #9e8c7e);
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mcard-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.2rem;
}
.mcard-meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--text-muted, #9e8c7e);
}
.mcard-meta-item svg { width: 13px; height: 13px; flex-shrink: 0; }
.mcard-duration { opacity: 0.75; }

.mcard-countdown {
  margin-top: 0.35rem;
  display: inline-flex;
  width: fit-content;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--coffee-bean, #6d4c3d);
  background: rgba(220, 201, 182, 0.4);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
}
.mcard-countdown--soon {
  color: #fff;
  background: var(--camel, #a39171);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}

.mcard-past-badge {
  margin-top: 0.35rem;
  display: inline-flex;
  width: fit-content;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted, #9e8c7e);
  background: rgba(220, 201, 182, 0.25);
  border-radius: 999px;
  padding: 0.18rem 0.65rem;
}
</style>