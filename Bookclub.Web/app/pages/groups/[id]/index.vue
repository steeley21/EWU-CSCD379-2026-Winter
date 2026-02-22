<!-- /app/pages/groups/[id]/index.vue -->
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
          :group-books="groupBooks"
          :can-manage="canManage"
          :loading="loadingBooks"
          :error="booksError"
          @add="openAddBook"
          @remove="removeGroupBook"
          @library="goToLibrary"
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

    <!-- Add Book Dialog -->
    <v-dialog v-model="bookDialog" max-width="560">
      <v-card class="bc-card" rounded="lg">
        <v-card-title style="font-family: var(--font-display); font-weight: 800;">
          Add Book to Group
        </v-card-title>

    <v-card-text>
      <v-text-field
        v-model="bookSearch"
        label="Search for a book..."
        variant="outlined"
        density="comfortable"
        clearable
        :loading="allBooksLoading"
        @update:model-value="onBookSearch"
        @click:clear="searchResults = []"
      />

      <!-- Search results list -->
      <v-list v-if="searchResults.length && !chosenBook" lines="two" class="rounded border mb-2">
        <v-list-item
          v-for="book in searchResults"
          :key="book.isbn ?? book.title"
          :title="book.title"
          :subtitle="`${book.authorFirst} ${book.authorLast}${book.publishYear ? ' · ' + book.publishYear : ''}`"
          @click="selectBook(book)"
        >
          <template #append>
            <v-icon :color="book.source === 'db' ? 'success' : 'grey'">
              {{ book.source === 'db' ? 'mdi-database-check' : 'mdi-cloud-search' }}
            </v-icon>
          </template>
        </v-list-item>
      </v-list>

      <!-- Chosen book chip -->
      <v-chip
        v-if="chosenBook"
        class="mt-1 mb-2"
        color="primary"
        closable
        @click:close="chosenBook = null; bookSearch = ''"
      >
        {{ chosenBook.title }} — {{ chosenBook.authorFirst }} {{ chosenBook.authorLast }}
      </v-chip>

      <v-alert v-if="bookErr" type="error" variant="tonal" class="mt-2">
        {{ bookErr }}
      </v-alert>
    </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="bookDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="bookSaving"
            :disabled="!chosenBook"
            @click="saveGroupBook"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Meeting Dialog (unchanged except items now come from computed books) -->
    <v-dialog v-model="meetingDialog" max-width="560">
      <v-card class="bc-card" rounded="lg">
        <v-card-title style="font-family: var(--font-display); font-weight: 800;">
          Add Meeting
        </v-card-title>

        <v-card-text>
          <v-select
            v-model="meetingBookId"
            :items="meetingBookOptions"
            item-title="title"
            item-value="value"
            label="Book"
            variant="outlined"
            density="comfortable"
            :disabled="loadingBooks"
          />

          <v-row class="mt-2">
            <v-col cols="12" sm="7">
              <v-text-field v-model="meetingDate" label="Date" type="date" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="5">
              <v-text-field v-model="meetingTime" label="Time" type="time" variant="outlined" density="comfortable" />
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
              <v-text-field v-model="meetingLocation" label="Location (optional)" variant="outlined" density="comfortable" />
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
          <v-btn color="primary" :loading="meetingSaving" :disabled="books.length === 0" @click="saveMeeting">
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
import { booksService } from '~/services/booksService'
import type { BookDto, GroupBookDto, GroupMemberDto, GroupScheduleDto, GroupSummaryDto } from '~/types/dtos'

import GroupScheduleCard from '~/components/groups/GroupScheduleCard.vue'
import GroupMembersCard from '~/components/groups/GroupMembersCard.vue'
import GroupBooksCard from '~/components/groups/GroupBooksCard.vue'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const route = useRoute()

const group = ref<GroupSummaryDto | null>(null)
const members = ref<GroupMemberDto[]>([])
const groupBooks = ref<GroupBookDto[]>([])
const schedule = ref<GroupScheduleDto[]>([])

const pageError = ref('')

const loadingMembers = ref(true)
const loadingBooks = ref(true)
const loadingSchedule = ref(true)

const membersError = ref('')
const booksError = ref('')
const scheduleError = ref('')

const groupId = computed(() => Number(route.params.id))

const canManage = computed(() =>
  auth.isAdmin || (!!group.value?.adminId && group.value.adminId === auth.userId)
)

// derive books for scheduler + select
const books = computed<BookDto[]>(() => groupBooks.value.map(gb => gb.book))
const currentBook = computed<BookDto | null>(() => books.value[0] ?? null)

// ─────────────────────────────────────────────────────────────
// Add Book dialog state
// ─────────────────────────────────────────────────────────────

import type { BookSearchResult } from '~/services/booksService'

const bookDialog = ref(false)
const bookSearch = ref('')
const searchResults = ref<BookSearchResult[]>([])
const chosenBook = ref<BookSearchResult | null>(null)
const allBooksLoading = ref(false)
const bookSaving = ref(false)
const bookErr = ref('')

let searchTimer: ReturnType<typeof setTimeout>

function onBookSearch(val: string) {
  clearTimeout(searchTimer)
  searchResults.value = []
  if (!val || val.length < 2) return

  searchTimer = setTimeout(async () => {
    allBooksLoading.value = true
    try {
      searchResults.value = await booksService.search(val)
    } catch (e: any) {
      bookErr.value = e?.message ?? 'Search failed.'
    } finally {
      allBooksLoading.value = false
    }
  }, 350)
}

function selectBook(book: BookSearchResult) {
  chosenBook.value = book
  searchResults.value = []
  bookSearch.value = ''
}

function openAddBook() {
  if (!canManage.value) return
  bookErr.value = ''
  bookSearch.value = ''
  searchResults.value = []
  chosenBook.value = null
  bookDialog.value = true
}

async function saveGroupBook() {
  bookErr.value = ''
  if (!chosenBook.value) { bookErr.value = 'Please select a book.'; return }

  bookSaving.value = true
  try {
    let bookId: number

    if (chosenBook.value.source === 'db' && chosenBook.value.id != null) {
      bookId = Number(chosenBook.value.id)
      if (!Number.isFinite(bookId) || bookId <= 0) {
        bookErr.value = 'Selected book has an invalid id.'
        return
      }
    } else {
      // From Open Library — save to DB first to get a real ID
      const saved = await booksService.saveFromCatalog(chosenBook.value)

      // backend returns bId; your frontend model prefers id
      const savedId = saved.id

      if (!Number.isFinite(savedId) || savedId <= 0) {
        throw new Error('Book save did not return a valid id.')
      }

      bookId = savedId
    }

    await groupsService.addBook(groupId.value, bookId)
    groupBooks.value = await groupsService.getGroupBooks(groupId.value)
    bookDialog.value = false
    chosenBook.value = null
  } catch (e: any) {
    const data = e?.response?.data
    bookErr.value =
      (typeof data === 'string' ? data : data?.message) ??
      e?.message ??
      'Could not add book.'
    console.error(e)
  } finally {
    bookSaving.value = false
  }
}

async function removeGroupBook(gbId: number) {
  if (!canManage.value) return

  booksError.value = ''
  loadingBooks.value = true
  try {
    await groupsService.removeBook(groupId.value, gbId)
    groupBooks.value = await groupsService.getGroupBooks(groupId.value)
  } catch (e: any) {
    const data = e?.response?.data
    booksError.value =
      (typeof data === 'string' ? data : data?.message) ??
      e?.message ??
      'Could not remove book.'
    console.error(e)
  } finally {
    loadingBooks.value = false
  }
}

const router = useRouter()

function goToLibrary() {
  router.push(`/groups/${groupId.value}/library`)
}

// ─────────────────────────────────────────────────────────────
// Schedule helpers
// ─────────────────────────────────────────────────────────────

const nextMeeting = computed<GroupScheduleDto | null>(() => {
  const now = Date.now()
  const parsed = schedule.value
    .map(s => ({ s, t: s.dateTime ? Date.parse(String(s.dateTime)) : NaN }))
    .filter((x): x is { s: GroupScheduleDto; t: number } => Number.isFinite(x.t))

  if (parsed.length === 0) return null

  const future = parsed.filter(x => x.t >= now).sort((a, b) => a.t - b.t).at(0)
  if (future) return future.s

  const latestPast = parsed.slice().sort((a, b) => b.t - a.t).at(0)
  return latestPast?.s ?? null
})

const upcomingMeetings = computed<GroupScheduleDto[]>(() => {
  const now = Date.now()
  const items = schedule.value
    .map(s => ({ s, t: s.dateTime ? Date.parse(String(s.dateTime)) : NaN }))
    .filter((x): x is { s: GroupScheduleDto; t: number } => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t)
    .map(x => x.s)

  return items.filter(s => (s.dateTime ? Date.parse(String(s.dateTime)) : 0) >= now).slice(0, 6)
})

type MeetingBookOption = { title: string; value: number }

const meetingBookOptions = computed<MeetingBookOption[]>(() =>
  books.value
    .filter(b => Number.isFinite(Number(b.id)) && Number(b.id) > 0)
    .map(b => ({
      title: String(b.title ?? `Book ${b.id}`),
      value: Number(b.id),
    }))
)
// ─────────────────────────────────────────────────────────────
// Meeting dialog state (same as yours)
// ─────────────────────────────────────────────────────────────

const meetingDialog = ref(false)
const meetingBookId = ref<number | null>(null)
const meetingDate = ref('')
const meetingTime = ref('')
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

  const m24 = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) {
    const hh = Number(m24[1])
    const mm = Number(m24[2])
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    }
  }

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

async function saveMeeting() {
  meetingErr.value = ''

  const bid = Number(meetingBookId.value)

  if (!Number.isFinite(bid) || bid <= 0) {
    meetingErr.value = 'Please choose a valid book.'
    return
  }
  if (!meetingDate.value) { meetingErr.value = 'Please choose a date.'; return }

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
      bId: bid,
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
        .flatMap(([field, msgs]) => (Array.isArray(msgs) ? msgs : [String(msgs)]).map(m => `${field}: ${m}`))
        .join(' • ')
    } else {
      meetingErr.value = data?.message ?? data?.title ?? err?.message ?? 'Could not save meeting.'
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
    if (!g) { pageError.value = 'Group not found.'; group.value = null; return }
    group.value = g
  } catch (e) {
    pageError.value = 'Could not load group.'
    console.error(e)
  }

  const results = await Promise.allSettled([
    groupsService.getMembers(id),
    groupsService.getGroupBooks(id),
    groupsService.getSchedule(id),
  ])

  if (results[0].status === 'fulfilled') members.value = results[0].value
  else membersError.value = 'Could not load members.'
  loadingMembers.value = false

  if (results[1].status === 'fulfilled') groupBooks.value = results[1].value
  else booksError.value = 'Could not load books.'
  loadingBooks.value = false

  if (results[2].status === 'fulfilled') schedule.value = results[2].value
  else scheduleError.value = 'Could not load schedule.'
  loadingSchedule.value = false
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