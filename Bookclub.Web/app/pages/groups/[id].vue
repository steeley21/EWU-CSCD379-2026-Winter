<template>
  <div class="group-page">

    <!-- Loading -->
    <div v-if="loading" class="gp-loading">
      <div class="gp-skel gp-skel--title" />
      <div class="gp-skel gp-skel--sub" />
      <div class="gp-body-grid">
        <div class="gp-skel gp-skel--panel" />
        <div class="gp-skel gp-skel--panel" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="gp-error">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else-if="group">

      <!-- ── Header ── -->
      <div class="gp-header">
        <NuxtLink to="/dashboard" class="gp-back">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Dashboard
        </NuxtLink>

        <div class="gp-eyebrow">Reading Group</div>
        <h1 class="gp-title">{{ group.groupName }}</h1>
        <div class="gp-header-bottom">
          <p class="gp-meta-line">
            Administered by <strong>{{ group.adminFullName }}</strong>
            &nbsp;·&nbsp;
            <span>{{ members.length }} member{{ members.length !== 1 ? 's' : '' }}</span>
          </p>

          <!-- Admin action buttons -->
          <div v-if="isAdmin" class="gp-admin-actions">
            <button class="gp-btn gp-btn--secondary" @click="openInviteModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Invite Member
            </button>
            <button class="gp-btn gp-btn--primary" @click="openAddBookModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Book
            </button>
          </div>
        </div>
      </div>

      <!-- ── Body grid ── -->
      <div class="gp-body-grid">

        <!-- ════ Left column ════ -->
        <div class="gp-left">

          <!-- Current book -->
          <section class="gp-panel">
            <div class="gp-panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              Currently Reading
            </div>

            <!-- Has a book -->
            <div v-if="currentBook" class="book-card">
              <div class="book-spine" />
              <div class="book-info">
                <div class="book-title">{{ currentBook.title }}</div>
                <div class="book-author">{{ currentBook.authorFirst }} {{ currentBook.authorLast }}</div>
                <div class="book-isbn bc-muted">ISBN: {{ currentBook.isbn }}</div>
              </div>
            </div>

            <!-- No book -->
            <div v-else class="gp-empty-inline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>No book selected yet.</span>
            </div>
          </section>

          <!-- Members -->
          <section class="gp-panel">
            <div class="gp-panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Members
            </div>

            <ul class="member-list">
              <li
                v-for="member in sortedMembers"
                :key="member.uGID"
                class="member-row"
              >
                <div class="member-avatar">
                  {{ initials(member.fullName) }}
                </div>
                <div class="member-info">
                  <span class="member-name">{{ member.fullName }}</span>
                  <span class="member-username">@{{ member.userName }}</span>
                </div>
                <span v-if="member.userID === group.adminID" class="member-badge">
                  Admin
                </span>
              </li>
            </ul>

            <div v-if="members.length === 0" class="gp-empty-inline">
              <span>No members found.</span>
            </div>
          </section>

        </div>

        <!-- ════ Right column ════ -->
        <div class="gp-right">

          <!-- Next meeting / Calendar -->
          <section class="gp-panel gp-panel--calendar">
            <div class="gp-panel-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Next Meeting
            </div>

            <template v-if="nextMeeting">
              <div class="cal-display">
                <div class="cal-month">{{ formatMonth(nextMeeting.dateTime) }}</div>
                <div class="cal-day">{{ formatDay(nextMeeting.dateTime) }}</div>
                <div class="cal-year">{{ formatYear(nextMeeting.dateTime) }}</div>
              </div>
              <div class="cal-details">
                <div class="cal-detail-row">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ formatTime(nextMeeting.dateTime) }}
                  <span v-if="nextMeeting.duration" class="bc-muted">&nbsp;· {{ nextMeeting.duration }} min</span>
                </div>
                <div v-if="nextMeeting.location" class="cal-detail-row">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ nextMeeting.location }}
                </div>
                <div v-if="nextMeeting.book" class="cal-detail-row">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  {{ nextMeeting.book.title }}
                </div>
              </div>
            </template>

            <div v-else class="gp-empty-inline gp-empty-inline--col">
              <div class="cal-display cal-display--empty">
                <div class="cal-month">—</div>
                <div class="cal-day">?</div>
              </div>
              <span>No meetings scheduled yet.</span>
            </div>

            <template v-if="schedule.length > 1">
              <div class="cal-upcoming-label">Upcoming</div>
              <ul class="cal-upcoming-list">
                <li
                  v-for="s in schedule.slice(1, 4)"
                  :key="s.gSID"
                  class="cal-upcoming-row"
                >
                  <div class="cal-upcoming-dot" />
                  <div>
                    <div class="cal-upcoming-date">{{ formatShort(s.dateTime) }}</div>
                    <div class="cal-upcoming-book bc-muted">{{ s.book?.title ?? '—' }}</div>
                  </div>
                </li>
              </ul>
            </template>

          </section>

        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════
         Invite Member Modal
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showInviteModal" class="modal-backdrop" @click.self="closeInviteModal">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="invite-title">
            <div class="modal-header">
              <h2 id="invite-title" class="modal-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Invite a Member
              </h2>
              <button class="modal-close" @click="closeInviteModal" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <p class="modal-desc">Enter the username of the person you'd like to add to <strong>{{ group?.groupName }}</strong>.</p>

              <div class="form-field">
                <label class="form-label" for="invite-username">Username</label>
                <div class="form-input-wrap">
                  <span class="form-prefix">@</span>
                  <input
                    id="invite-username"
                    v-model="inviteUsername"
                    class="form-input form-input--prefixed"
                    type="text"
                    placeholder="e.g. janedoe"
                    :disabled="inviteLoading"
                    @keyup.enter="submitInvite"
                  />
                </div>
              </div>

              <!-- Feedback -->
              <div v-if="inviteError" class="form-feedback form-feedback--error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ inviteError }}
              </div>
              <div v-if="inviteSuccess" class="form-feedback form-feedback--success">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {{ inviteSuccess }}
              </div>
            </div>

            <div class="modal-footer">
              <button class="gp-btn gp-btn--ghost" @click="closeInviteModal" :disabled="inviteLoading">Cancel</button>
              <button class="gp-btn gp-btn--primary" @click="submitInvite" :disabled="inviteLoading || !inviteUsername.trim()">
                <span v-if="inviteLoading" class="btn-spinner" />
                <span>{{ inviteLoading ? 'Sending…' : 'Send Invite' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════
         Add Book Modal
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddBookModal" class="modal-backdrop" @click.self="closeAddBookModal">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="addbook-title">
            <div class="modal-header">
              <h2 id="addbook-title" class="modal-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                Add a Book
              </h2>
              <button class="modal-close" @click="closeAddBookModal" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <p class="modal-desc">Add a book to <strong>{{ group?.groupName }}</strong>'s reading list.</p>

              <div class="form-grid">
                <div class="form-field form-field--full">
                  <label class="form-label" for="book-title">Title <span class="form-required">*</span></label>
                  <input
                    id="book-title"
                    v-model="bookForm.title"
                    class="form-input"
                    type="text"
                    placeholder="e.g. The Great Gatsby"
                    :disabled="bookLoading"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="book-first">Author First Name <span class="form-required">*</span></label>
                  <input
                    id="book-first"
                    v-model="bookForm.authorFirst"
                    class="form-input"
                    type="text"
                    placeholder="e.g. F. Scott"
                    :disabled="bookLoading"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="book-last">Author Last Name <span class="form-required">*</span></label>
                  <input
                    id="book-last"
                    v-model="bookForm.authorLast"
                    class="form-input"
                    type="text"
                    placeholder="e.g. Fitzgerald"
                    :disabled="bookLoading"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="book-isbn">ISBN</label>
                  <input
                    id="book-isbn"
                    v-model="bookForm.isbn"
                    class="form-input"
                    type="text"
                    placeholder="e.g. 978-3-16-148410-0"
                    :disabled="bookLoading"
                  />
                </div>

                <div class="form-field">
                  <label class="form-label" for="book-publish">Publish Date</label>
                  <input
                    id="book-publish"
                    v-model="bookForm.publishDate"
                    class="form-input"
                    type="date"
                    :disabled="bookLoading"
                  />
                </div>
              </div>

              <!-- Feedback -->
              <div v-if="bookError" class="form-feedback form-feedback--error">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ bookError }}
              </div>
              <div v-if="bookSuccess" class="form-feedback form-feedback--success">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                {{ bookSuccess }}
              </div>
            </div>

            <div class="modal-footer">
              <button class="gp-btn gp-btn--ghost" @click="closeAddBookModal" :disabled="bookLoading">Cancel</button>
              <button class="gp-btn gp-btn--primary" @click="submitAddBook" :disabled="bookLoading || !bookFormValid">
                <span v-if="bookLoading" class="btn-spinner" />
                <span>{{ bookLoading ? 'Adding…' : 'Add Book' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ middleware: 'auth' })

const route  = useRoute()
const auth   = useAuthStore()
const id     = Number(route.params.id)

/* ── Types ─────────────────────────────────────────────── */
interface GroupDto {
  groupID: number
  groupName: string
  adminID: string
  adminFullName: string
  memberCount: number
}

interface MemberDto {
  uGID: number
  userID: string
  fullName: string
  userName: string
}

interface BookDto {
  bId: number
  authorFirst: string
  authorLast: string
  title: string
  publishDate: string
  isbn: string
}

interface GroupBookDto {
  gBID: number
  groupID: number
  book: BookDto
}

interface ScheduleDto {
  gSID: number
  groupID: number
  book: BookDto
  dateTime: string
  duration: number
  location: string
}

/* ── State ─────────────────────────────────────────────── */
const group       = ref<GroupDto | null>(null)
const members     = ref<MemberDto[]>([])
const groupBooks  = ref<GroupBookDto[]>([])
const schedule    = ref<ScheduleDto[]>([])
const loading     = ref(true)
const error       = ref('')

/* ── Admin check ────────────────────────────────────────── */
const isAdmin = computed(() => group.value?.adminID === auth.user?.id)

/* ── Invite modal state ─────────────────────────────────── */
const showInviteModal = ref(false)
const inviteUsername  = ref('')
const inviteLoading   = ref(false)
const inviteError     = ref('')
const inviteSuccess   = ref('')

function openInviteModal() {
  inviteUsername.value = ''
  inviteError.value    = ''
  inviteSuccess.value  = ''
  showInviteModal.value = true
}

function closeInviteModal() {
  if (inviteLoading.value) return
  showInviteModal.value = false
}

async function submitInvite() {
  if (!inviteUsername.value.trim() || inviteLoading.value) return
  inviteError.value   = ''
  inviteSuccess.value = ''
  inviteLoading.value = true

  const token = localStorage.getItem('bookclub.token')
  try {
    await $fetch(`http://localhost:5000/api/Groups/${id}/invite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { userName: inviteUsername.value.trim() },
    })
    inviteSuccess.value = `@${inviteUsername.value.trim()} has been invited!`
    inviteUsername.value = ''
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    inviteError.value = err.status === 404
      ? 'User not found. Check the username and try again.'
      : err.status === 409
      ? 'This user is already a member of the group.'
      : 'Something went wrong. Please try again.'
  } finally {
    inviteLoading.value = false
  }
}

/* ── Add Book modal state ───────────────────────────────── */
const showAddBookModal = ref(false)
const bookLoading      = ref(false)
const bookError        = ref('')
const bookSuccess      = ref('')

const bookForm = reactive({
  title: '',
  authorFirst: '',
  authorLast: '',
  isbn: '',
  publishDate: '',
})

const bookFormValid = computed(() =>
  bookForm.title.trim() && bookForm.authorFirst.trim() && bookForm.authorLast.trim()
)

function openAddBookModal() {
  bookForm.title       = ''
  bookForm.authorFirst = ''
  bookForm.authorLast  = ''
  bookForm.isbn        = ''
  bookForm.publishDate = ''
  bookError.value      = ''
  bookSuccess.value    = ''
  showAddBookModal.value = true
}

function closeAddBookModal() {
  if (bookLoading.value) return
  showAddBookModal.value = false
}

async function submitAddBook() {
  if (!bookFormValid.value || bookLoading.value) return
  bookError.value   = ''
  bookSuccess.value = ''
  bookLoading.value = true

  const token = localStorage.getItem('bookclub.token')
  try {
    const newBook = await $fetch<GroupBookDto>(`http://localhost:5000/api/Groups/${id}/books`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        title:       bookForm.title.trim(),
        authorFirst: bookForm.authorFirst.trim(),
        authorLast:  bookForm.authorLast.trim(),
        isbn:        bookForm.isbn.trim() || null,
        publishDate: bookForm.publishDate || null,
      },
    })
    groupBooks.value.unshift(newBook)
    bookSuccess.value = `"${bookForm.title.trim()}" has been added!`
    bookForm.title = bookForm.authorFirst = bookForm.authorLast = bookForm.isbn = bookForm.publishDate = ''
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    bookError.value = err.status === 409
      ? 'This book is already in the group.'
      : 'Something went wrong. Please try again.'
  } finally {
    bookLoading.value = false
  }
}

/* ── Derived ────────────────────────────────────────────── */
const currentBook = computed(() => groupBooks.value[0]?.book ?? null)

const nextMeeting = computed(() => {
  const now = Date.now()
  return schedule.value.find(s => Date.parse(s.dateTime) >= now) ?? schedule.value[0] ?? null
})

const sortedMembers = computed(() => {
  if (!group.value) return members.value
  const adminId = group.value.adminID
  return [...members.value].sort((a, b) => {
    if (a.userID === adminId) return -1
    if (b.userID === adminId) return 1
    return a.fullName.localeCompare(b.fullName)
  })
})

/* ── Fetch ──────────────────────────────────────────────── */
onMounted(async () => {
  auth.hydrate()
  const token = localStorage.getItem('bookclub.token')
  if (!token) { await navigateTo('/login'); return }

  const headers = { Authorization: `Bearer ${token}` }
  const base    = `http://localhost:5000/api/Groups/${id}`

  try {
    const [g, m, b, s] = await Promise.all([
      $fetch<GroupDto>         (base,               { headers }),
      $fetch<MemberDto[]>      (`${base}/members`,  { headers }),
      $fetch<GroupBookDto[]>   (`${base}/books`,    { headers }),
      $fetch<ScheduleDto[]>    (`${base}/schedule`, { headers }),
    ])
    group.value      = g
    members.value    = m
    groupBooks.value = b
    schedule.value   = s
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    error.value = err.status === 404
      ? 'This group could not be found.'
      : 'Failed to load group. Please try again.'
  } finally {
    loading.value = false
  }
})

/* ── Helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function formatMonth(dt: string) {
  return new Date(dt).toLocaleString('default', { month: 'short' }).toUpperCase()
}
function formatDay(dt: string) {
  return new Date(dt).getDate()
}
function formatYear(dt: string) {
  return new Date(dt).getFullYear()
}
function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' })
}
function formatShort(dt: string) {
  return new Date(dt).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
/* ── Page shell ── */
.group-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1rem, 3vw, 2rem);
  font-family: var(--font-body);
  color: var(--text-base);
}

/* ── Back link & header ── */
.gp-back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color var(--ease);
}
.gp-back svg { width: 14px; height: 14px; }
.gp-back:hover { color: var(--coffee-bean); }

.gp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 0.5rem;
}
.gp-eyebrow::before {
  content: '';
  display: block;
  width: 20px;
  height: 1px;
  background: var(--camel);
}

.gp-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.06;
  color: var(--text-base);
  margin-bottom: 0.6rem;
}

.gp-header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.gp-meta-line {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 400;
}
.gp-meta-line strong { color: var(--text-base); font-weight: 600; }

.gp-header {
  margin-bottom: 2.5rem;
  animation: fadeUp 0.55s ease both;
}

/* ── Admin action buttons ── */
.gp-admin-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
}

/* ── Buttons ── */
.gp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill, 999px);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  white-space: nowrap;
  text-decoration: none;
}
.gp-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.gp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.gp-btn--primary {
  background: var(--coffee-bean);
  color: #fff;
  border-color: var(--coffee-bean);
}
.gp-btn--primary:not(:disabled):hover {
  background: var(--dusty-olive);
  border-color: var(--dusty-olive);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.gp-btn--secondary {
  background: var(--surface);
  color: var(--coffee-bean);
  border-color: var(--camel);
}
.gp-btn--secondary:not(:disabled):hover {
  background: var(--pale-oak);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.gp-btn--ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
.gp-btn--ghost:not(:disabled):hover {
  background: var(--bg);
  color: var(--text-base);
}

/* Spinner inside button */
.btn-spinner {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Body grid ── */
.gp-body-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 820px) {
  .gp-body-grid {
    grid-template-columns: 1fr;
  }
  .gp-right { order: -1; }
}

.gp-left, .gp-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ── Panel ── */
.gp-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1.75rem;
  box-shadow: var(--shadow-sm);
  animation: fadeUp 0.55s 0.08s ease both;
}

.gp-panel-header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border);
}
.gp-panel-header svg { width: 15px; height: 15px; flex-shrink: 0; }

/* ── Book card ── */
.book-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.book-spine {
  width: 10px;
  min-height: 90px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--camel), var(--pale-oak));
  flex-shrink: 0;
}

.book-info { flex: 1; }

.book-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-base);
  line-height: 1.25;
  margin-bottom: 0.3rem;
}

.book-author {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.book-isbn {
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: var(--text-light);
}

/* ── Member list ── */
.member-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.6rem 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--ease);
}
.member-row:hover { background: var(--bg); }

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--pale-oak);
  color: var(--coffee-bean);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid rgba(163, 145, 113, 0.25);
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-base);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-username {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.member-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--coffee-bean);
  background: var(--pale-oak);
  border: 1px solid rgba(163, 145, 113, 0.4);
  border-radius: var(--radius-pill);
  padding: 0.2rem 0.6rem;
  flex-shrink: 0;
}

/* ── Calendar panel ── */
.gp-panel--calendar { position: sticky; top: 88px; }

.cal-display {
  text-align: center;
  background: var(--bg);
  border-radius: var(--radius-md);
  padding: 1.5rem 1rem 1.25rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--border);
}

.cal-display--empty { opacity: 0.45; }

.cal-month {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--camel);
  margin-bottom: 0.25rem;
}

.cal-day {
  font-family: var(--font-display);
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--coffee-bean);
  line-height: 1;
  margin-bottom: 0.2rem;
}

.cal-year {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.cal-details {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.cal-detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-base);
}
.cal-detail-row svg { width: 14px; height: 14px; color: var(--dusty-olive); flex-shrink: 0; }

.cal-upcoming-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  border-top: 1px solid var(--border);
  padding-top: 1rem;
  margin-bottom: 0.75rem;
}

.cal-upcoming-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.cal-upcoming-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.cal-upcoming-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--camel);
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.cal-upcoming-date {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-base);
}

.cal-upcoming-book {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ── Empty inline state ── */
.gp-empty-inline {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  padding: 0.5rem 0;
}
.gp-empty-inline svg { width: 18px; height: 18px; opacity: 0.45; flex-shrink: 0; }
.gp-empty-inline--col { flex-direction: column; text-align: center; }

/* ── Loading skeletons ── */
.gp-loading { animation: fadeUp 0.4s ease both; }

.gp-skel {
  background: linear-gradient(90deg, var(--pale-oak) 25%, rgba(220,201,182,0.35) 50%, var(--pale-oak) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius-md);
}
.gp-skel--title  { height: 48px; width: 55%; margin-bottom: 0.75rem; border-radius: var(--radius-md); }
.gp-skel--sub    { height: 18px; width: 35%; margin-bottom: 2.5rem; }
.gp-skel--panel  { height: 260px; }

/* ── Error state ── */
.gp-error {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  color: #b94a48;
  font-size: 0.9rem;
  max-width: 500px;
  margin: 4rem auto;
}
.gp-error svg { width: 20px; height: 20px; flex-shrink: 0; }

/* ════════════════════════════════════════════
   Modal
════════════════════════════════════════════ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(30, 22, 14, 0.45);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(30, 22, 14, 0.25), 0 4px 16px rgba(30, 22, 14, 0.1);
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-base);
  margin: 0;
}
.modal-title svg { width: 18px; height: 18px; color: var(--dusty-olive); flex-shrink: 0; }

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--ease), color var(--ease);
  flex-shrink: 0;
}
.modal-close svg { width: 16px; height: 16px; }
.modal-close:hover { background: var(--bg); color: var(--text-base); }

.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}
.modal-desc strong { color: var(--text-base); }

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid var(--border);
}

/* ── Form elements ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.form-field { display: flex; flex-direction: column; gap: 0.35rem; }
.form-field--full { grid-column: 1 / -1; }

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-base);
  letter-spacing: 0.02em;
}

.form-required { color: var(--camel); }

.form-input-wrap { position: relative; display: flex; align-items: center; }

.form-prefix {
  position: absolute;
  left: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  pointer-events: none;
  user-select: none;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-base);
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.55rem 0.85rem;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  outline: none;
}

.form-input--prefixed { padding-left: 1.75rem; }

.form-input::placeholder { color: var(--text-light, #b0a090); }

.form-input:focus {
  border-color: var(--camel);
  box-shadow: 0 0 0 3px rgba(163, 145, 113, 0.18);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Feedback messages ── */
.form-feedback {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.82rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  line-height: 1.45;
}
.form-feedback svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 0.1rem; }

.form-feedback--error {
  background: #fff5f5;
  color: #b94a48;
  border: 1px solid rgba(185, 74, 72, 0.2);
}

.form-feedback--success {
  background: #f2faf5;
  color: #2e7d52;
  border: 1px solid rgba(46, 125, 82, 0.2);
}

/* ── Modal transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.22s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.22s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal {
  transform: translateY(16px) scale(0.97);
  opacity: 0;
}
.modal-leave-to .modal {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}

/* ── Animations ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.bc-muted { color: var(--text-muted); }
</style>