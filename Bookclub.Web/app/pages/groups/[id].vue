<template>
  <div class="group-profile">
    <div class="gp-header">
      <NuxtLink to="/dashboard" class="gp-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back
      </NuxtLink>

      <div class="eyebrow">Group</div>
      <h1 class="gp-title">{{ group?.groupName ?? 'Group' }}</h1>
      <p v-if="group?.adminFullName" class="gp-sub">Admin: {{ group.adminFullName }}</p>
    </div>

    <v-row>
      <!-- Left column: Members + Books -->
      <v-col cols="12" md="5">
        <GroupMembersCard
          :members="members"
          :loading="loadingMembers"
          :error="membersError"
        />
        <div class="gp-gap" />
        <GroupBooksCard
          :books="books"
          :loading="loadingBooks"
          :error="booksError"
        />
      </v-col>

      <!-- Right column: Schedule -->
      <v-col cols="12" md="7">
        <GroupScheduleCard
          :next="nextMeeting"
          :upcoming="upcomingMeetings"
          :current-book="currentBook"
          :loading="loadingSchedule"
          :error="scheduleError"
          @add="openAddMeeting"
          @delete="deleteMeeting"
        />
      </v-col>
    </v-row>

    <v-alert v-if="pageError" type="error" variant="tonal" class="mt-4">
      {{ pageError }}
    </v-alert>

    <!-- Add Meeting Dialog -->
    <v-dialog v-model="meetingDialog" max-width="560">
      <v-card class="bc-card" rounded="lg">
        <v-card-title style="font-family: var(--font-display); font-weight: 800;">
          Add Meeting
        </v-card-title>

        <v-card-text>
          <v-select
            v-model="meetingBookId"
            :items="books"
            item-title="title"
            item-value="id"
            label="Book"
            variant="outlined"
            density="comfortable"
            :disabled="loadingBooks"
          />

          <v-row class="mt-2">
            <v-col cols="12" sm="7">
              <v-text-field
                v-model="meetingDate"
                label="Date"
                type="date"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="meetingTime"
                label="Time"
                type="time"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-row class="mt-1">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="meetingDuration"
                label="Duration (minutes)"
                type="number"
                min="1"
                max="1440"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="meetingLocation"
                label="Location (optional)"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-alert v-if="meetingErr" type="error" variant="tonal" class="mt-2">
            {{ meetingErr }}
          </v-alert>

          <v-alert
            v-else-if="!loadingBooks && books.length === 0"
            type="warning"
            variant="tonal"
            class="mt-2"
          >
            This group has no books yet. Add a book to the group before scheduling a meeting.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="meetingDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="meetingSaving"
            :disabled="books.length === 0"
            @click="saveMeeting"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { groupsService } from '~/services/groupsService'
import type { BookDto, GroupMemberDto, GroupScheduleDto, GroupSummaryDto } from '~/types/dtos'

import GroupScheduleCard from '~/components/groups/GroupScheduleCard.vue'
import GroupMembersCard from '~/components/groups/GroupMembersCard.vue'
import GroupBooksCard from '~/components/groups/GroupBooksCard.vue'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const route = useRoute()

const group = ref<GroupSummaryDto | null>(null)
const members = ref<GroupMemberDto[]>([])
const books = ref<BookDto[]>([])
const schedule = ref<GroupScheduleDto[]>([])

const pageError = ref('')

const loadingMembers = ref(true)
const loadingBooks = ref(true)
const loadingSchedule = ref(true)

const membersError = ref('')
const booksError = ref('')
const scheduleError = ref('')

const groupId = computed(() => Number(route.params.id))

const currentBook = computed<BookDto | null>(() => books.value[0] ?? null)

// ─────────────────────────────────────────────────────────────
// Schedule helpers (now uses schedule.dateTime)
// ─────────────────────────────────────────────────────────────

const nextMeeting = computed<GroupScheduleDto | null>(() => {
  const now = Date.now()

  const parsed = schedule.value
    .map(s => ({ s, t: s.dateTime ? Date.parse(String(s.dateTime)) : NaN }))
    .filter((x): x is { s: GroupScheduleDto; t: number } => Number.isFinite(x.t))

  if (parsed.length === 0) return null

  const future = parsed
    .filter(x => x.t >= now)
    .sort((a, b) => a.t - b.t)
    .at(0)

  if (future) return future.s

  const latestPast = parsed
    .slice()
    .sort((a, b) => b.t - a.t)
    .at(0)

  return latestPast?.s ?? null
})

const upcomingMeetings = computed<GroupScheduleDto[]>(() => {
  const now = Date.now()

  const items = schedule.value
    .map(s => ({ s, t: s.dateTime ? Date.parse(String(s.dateTime)) : NaN }))
    .filter((x): x is { s: GroupScheduleDto; t: number } => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t)
    .map(x => x.s)

  return items
    .filter(s => (s.dateTime ? Date.parse(String(s.dateTime)) : 0) >= now)
    .slice(0, 6)
})

// ─────────────────────────────────────────────────────────────
// Meeting dialog state
// ─────────────────────────────────────────────────────────────

const meetingDialog = ref(false)
const meetingBookId = ref<number | null>(null)
const meetingDate = ref('') // YYYY-MM-DD
const meetingTime = ref('') // HH:mm (or sometimes "h:mm AM")
const meetingDuration = ref<number>(60)
const meetingLocation = ref<string>('Online')
const meetingErr = ref('')
const meetingSaving = ref(false)

function openAddMeeting() {
  meetingErr.value = ''
  meetingDate.value = ''
  meetingTime.value = '19:00'
  meetingDuration.value = 60
  meetingLocation.value = 'Online'
  meetingBookId.value = currentBook.value?.id ?? books.value[0]?.id ?? null
  meetingDialog.value = true
}

function normalizeTime(raw: string): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null

  // "HH:mm"
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) {
    const hh = Number(m24[1])
    const mm = Number(m24[2])
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    }
  }

  // "h:mm AM/PM"
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m12) {
    const apRaw = m12[3]
    if (!apRaw) return null

    let hh = Number(m12[1])
    const mm = Number(m12[2])
    const ap = apRaw.toUpperCase()

    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null
    if (ap === 'PM' && hh !== 12) hh += 12
    if (ap === 'AM' && hh === 12) hh = 0

    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
  }

  return null
}

// ─────────────────────────────────────────────────────────────
// Load
// ─────────────────────────────────────────────────────────────

async function loadAll(id: number) {
  pageError.value = ''
  membersError.value = ''
  booksError.value = ''
  scheduleError.value = ''

  loadingMembers.value = true
  loadingBooks.value = true
  loadingSchedule.value = true

  try {
    const g = await groupsService.getById(id)
    if (!g) {
      pageError.value = 'Group not found.'
      group.value = null
      return
    }
    group.value = g
  } catch (e) {
    pageError.value = 'Could not load group.'
    console.error(e)
  }

  const results = await Promise.allSettled([
    groupsService.getMembers(id),
    groupsService.getBooks(id),
    groupsService.getSchedule(id),
  ])

  // members
  if (results[0].status === 'fulfilled') members.value = results[0].value
  else membersError.value = 'Could not load members.'
  loadingMembers.value = false

  // books
  if (results[1].status === 'fulfilled') books.value = results[1].value
  else booksError.value = 'Could not load books.'
  loadingBooks.value = false

  // schedule
  if (results[2].status === 'fulfilled') schedule.value = results[2].value
  else scheduleError.value = 'Could not load schedule.'
  loadingSchedule.value = false
}

// ─────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────

async function saveMeeting() {
  meetingErr.value = ''

  if (!meetingBookId.value) {
    meetingErr.value = 'Please choose a book.'
    return
  }
  if (!meetingDate.value) {
    meetingErr.value = 'Please choose a date.'
    return
  }
  const dur = Number(meetingDuration.value)
  if (!Number.isFinite(dur) || dur < 1 || dur > 1440) {
    meetingErr.value = 'Duration must be between 1 and 1440 minutes.'
    return
  }

  const time = normalizeTime(meetingTime.value) ?? '19:00'
  const localIso = `${meetingDate.value}T${time}:00`
  const dateTimeIso = new Date(localIso).toISOString()

  meetingSaving.value = true
  try {
    await groupsService.addSchedule(groupId.value, {
      bId: meetingBookId.value,
      dateTime: dateTimeIso,
      duration: dur,
      location: meetingLocation.value?.trim() || null,
    })

    schedule.value = await groupsService.getSchedule(groupId.value)
    meetingDialog.value = false
  } catch (err: any) {
    const data = err?.response?.data
    const modelErrors = data?.errors

    if (modelErrors && typeof modelErrors === 'object') {
      meetingErr.value = Object.entries(modelErrors)
        .flatMap(([field, msgs]) =>
          (Array.isArray(msgs) ? msgs : [String(msgs)]).map(m => `${field}: ${m}`)
        )
        .join(' • ')
    } else {
      meetingErr.value =
        data?.message ??
        data?.title ??
        err?.message ??
        'Could not save meeting.'
    }

    console.error('Schedule POST failed:', data ?? err)
  } finally {
    meetingSaving.value = false
  }
}

async function deleteMeeting(gsId: number) {
  try {
    await groupsService.deleteSchedule(groupId.value, gsId)
    schedule.value = await groupsService.getSchedule(groupId.value)
  } catch (e) {
    scheduleError.value = 'Could not delete meeting.'
    console.error(e)
  }
}

onMounted(async () => {
  auth.hydrate()
  if (!Number.isFinite(groupId.value) || groupId.value <= 0) {
    pageError.value = 'Invalid group id.'
    return
  }
  await loadAll(groupId.value)
})

watch(() => route.params.id, async () => {
  const id = Number(route.params.id)
  if (Number.isFinite(id) && id > 0) await loadAll(id)
})
</script>

<style src="~/assets/group-profile.css" />