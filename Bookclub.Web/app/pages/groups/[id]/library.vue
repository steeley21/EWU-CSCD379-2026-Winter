<!-- /app/pages/groups/[id]/library.vue -->
<template>
  <div class="group-profile">
    <div class="gp-header">
      <NuxtLink :to="`/groups/${groupId}`" class="gp-back">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Group
      </NuxtLink>

      <div class="eyebrow">Library</div>
      <h1 class="gp-title">{{ (group?.groupName ?? 'Group') + ' — Library' }}</h1>
      <p class="gp-sub">All books this group has read or plans to read.</p>
    </div>

    <v-row class="gp-row" dense>
      <v-col cols="12">
        <v-card class="bc-card" rounded="lg">
          <div class="lib-head">
            <div>
              <div class="lib-title">
                Library <span class="gp-count">({{ books.length }})</span>
              </div>
              <div class="gp-sub">Click a book to view details.</div>
            </div>
          </div>

          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />

            <v-alert v-else-if="pageError" type="error" variant="tonal">
              {{ pageError }}
            </v-alert>

            <div v-else-if="books.length === 0" class="gp-muted">
              No books added to this group yet.
            </div>

            <v-row v-else class="lib-grid align-stretch" dense>
              <v-col
                v-for="b in books"
                :key="b.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card class="bc-card lib-card" rounded="lg" @click="openBook(b)">
                  <div class="lib-card-inner">
                    <div class="lib-cover">
                      <v-img
                        v-if="coverUrl(b)"
                        :src="coverUrl(b)!"
                        height="170"
                        cover
                        class="rounded"
                        :alt="String(b.title ?? 'Book cover')"
                      >
                        <template #error>
                          <div class="lib-cover-placeholder">
                            <v-icon icon="mdi-book-open-page-variant" size="18" />
                          </div>
                        </template>
                      </v-img>

                      <div v-else class="lib-cover-placeholder">
                        <v-icon icon="mdi-book-open-page-variant" size="18" />
                      </div>
                    </div>

                    <div class="lib-meta">
                      <div class="lib-book-title">{{ String(b.title ?? 'Untitled') }}</div>
                      <div class="gp-muted gp-small">{{ authorLabel(b) }}</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Book details modal -->
    <v-dialog v-model="detailsOpen" max-width="820">
      <v-card class="bc-card" rounded="lg">
        <v-card-title class="lib-modal-title">
          {{ selectedBook?.title ?? 'Book' }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <div class="lib-modal-cover">
                <v-img
                  v-if="selectedBook && coverUrl(selectedBook)"
                  :src="coverUrl(selectedBook)!"
                  height="240"
                  cover
                  class="rounded"
                >
                  <template #error>
                    <div class="lib-cover-placeholder lib-cover-placeholder-lg">
                      <v-icon icon="mdi-book-open-page-variant" size="22" />
                    </div>
                  </template>
                </v-img>

                <div v-else class="lib-cover-placeholder lib-cover-placeholder-lg">
                  <v-icon icon="mdi-book-open-page-variant" size="22" />
                </div>
              </div>
            </v-col>

            <v-col cols="12" sm="8">
              <div class="lib-kv">
                <div class="lib-k">Author</div>
                <div class="lib-v">{{ selectedBook ? authorLabel(selectedBook) : '—' }}</div>
              </div>

              <div class="lib-kv">
                <div class="lib-k">Publish date</div>
                <div class="lib-v">{{ selectedBook ? publishDateLabel(selectedBook) : '—' }}</div>
              </div>

              <div class="lib-kv" v-if="selectedBook && scheduledDates(selectedBook.id).length">
                <div class="lib-k">Scheduled meetings</div>
                <div class="lib-v">
                  <div class="lib-dates">
                    <span
                      v-for="(d, i) in scheduledDates(selectedBook.id)"
                      :key="i"
                      class="lib-date-chip"
                    >
                      {{ formatDateTime(d) }}
                    </span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>

          <div class="lib-desc">
            <div class="lib-desc-title">Description</div>

            <v-progress-linear v-if="descLoading" indeterminate color="var(--camel)" class="mb-2" />

            <div v-else-if="!description" class="gp-muted">
              No description available.
            </div>

            <div v-else class="lib-desc-text">
              {{ description }}
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailsOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { groupsService } from '~/services/groupsService'
import type { BookDto, GroupBookDto, GroupScheduleDto, GroupSummaryDto } from '~/types/dtos'
import { authorLabel, coverUrl, extractIsbn, publishDateLabel } from '~/utils/books'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const route = useRoute()

const groupId = computed(() => Number(route.params.id))

const group = ref<GroupSummaryDto | null>(null)
const groupBooks = ref<GroupBookDto[]>([])
const schedule = ref<GroupScheduleDto[]>([])

const loading = ref(true)
const pageError = ref('')


// derived
const books = computed<BookDto[]>(() => groupBooks.value.map(gb => gb.book))

// schedule index: bookId -> array of ISO strings
const scheduleByBookId = computed<Map<number, string[]>>(() => {
    const m = new Map<number, string[]>()
    for (const s of schedule.value) {
        const bid = Number((s.book as any)?.id)
        if (!Number.isFinite(bid) || bid <= 0) continue
        const dt = String((s as any).dateTime ?? '')
        if (!dt) continue
        const arr = m.get(bid) ?? []
    arr.push(dt)
    m.set(bid, arr)
}
// sort each array ascending
for (const [k, arr] of m.entries()) {
    arr.sort((a, b) => Date.parse(a) - Date.parse(b))
    m.set(k, arr)
}
return m
})

function scheduledDates(bookId: number): string[] {
    return scheduleByBookId.value.get(Number(bookId)) ?? []
}

function lastScheduledLabel(bookId: number): string | null {
    const dates = scheduledDates(bookId)
    if (!dates.length) return null
    return formatDateTime(dates[dates.length - 1]!)
}

function formatDateTime(iso: string): string {
    const t = Date.parse(String(iso))
    if (!Number.isFinite(t)) return String(iso)
    return new Intl.DateTimeFormat(undefined, {
weekday: 'short',
month: 'short',
day: 'numeric',
year: 'numeric',
hour: 'numeric',
minute: '2-digit',
}).format(new Date(t))
}

// ─────────────────────────────────────────────────────────────
// Details modal + OpenLibrary description
// ─────────────────────────────────────────────────────────────

let descRequestId = 0
const detailsOpen = ref(false)
const selectedBook = ref<BookDto | null>(null)
const description = ref<string>('')
const descLoading = ref(false)

// simple in-memory cache (isbn -> description)
const descCache = new Map<string, string>()

async function openBook(b: BookDto) {
  selectedBook.value = b
  detailsOpen.value = true
  description.value = ''
  await loadDescription(b)
}

async function loadDescription(b: BookDto) {
  const isbn = extractIsbn(b)
  if (!isbn) return

  // bump request id so stale responses can't overwrite
  const reqId = ++descRequestId

  if (descCache.has(isbn)) {
    description.value = descCache.get(isbn) ?? ''
    return
  }

  descLoading.value = true
  try {
    const isbnData: any = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`).then(r => {
      if (!r.ok) throw new Error('isbn lookup failed')
      return r.json()
    })

    if (reqId !== descRequestId) return // stale click

    const directDesc = isbnData?.description
    const directText =
      typeof directDesc === 'string'
        ? directDesc
        : (directDesc && typeof directDesc === 'object' && typeof directDesc.value === 'string')
          ? directDesc.value
          : ''

    if (directText) {
      descCache.set(isbn, directText)
      description.value = directText
      return
    }

    const workKey = Array.isArray(isbnData?.works) ? isbnData.works?.[0]?.key : null
    if (!workKey) return

    const workData: any = await fetch(`https://openlibrary.org${workKey}.json`).then(r => {
      if (!r.ok) throw new Error('work lookup failed')
      return r.json()
    })

    if (reqId !== descRequestId) return // stale click

    const workDesc = workData?.description
    const text =
      typeof workDesc === 'string'
        ? workDesc
        : (workDesc && typeof workDesc === 'object' && typeof workDesc.value === 'string')
          ? workDesc.value
          : ''

    if (text) {
      descCache.set(isbn, text)
      description.value = text
    }
  } catch {
    // best-effort; leave empty
  } finally {
    if (reqId === descRequestId) descLoading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Load
// ─────────────────────────────────────────────────────────────

async function loadAll(id: number) {
  loading.value = true
  pageError.value = ''

  try {
    const g = await groupsService.getById(id)
    if (!g) {
      group.value = null
      pageError.value = 'Group not found.'
      return
    }
    group.value = g
  } catch {
    pageError.value = 'Could not load group.'
  }

  const results = await Promise.allSettled([
    groupsService.getGroupBooks(id),
    groupsService.getSchedule(id),
  ])

  if (results[0].status === 'fulfilled') groupBooks.value = results[0].value
  else pageError.value = pageError.value || 'Could not load group books.'

  if (results[1].status === 'fulfilled') schedule.value = results[1].value
  // schedule failure isn't fatal for library page

  loading.value = false
}

onMounted(async () => {
  auth.hydrate()
  const id = Number(route.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    pageError.value = 'Invalid group id.'
    loading.value = false
    return
  }
  await loadAll(id)
})

watch(() => route.params.id, async () => {
  const id = Number(route.params.id)
  if (Number.isFinite(id) && id > 0) await loadAll(id)
})
</script>

<style scoped>
.lib-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:1rem;
  padding: 1rem 1rem 0.25rem;
}

.lib-title{
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}

.lib-grid{ margin-top: 0.25rem; }

/* ─────────────────────────────────────────────
   Grid cards: consistent size
   ───────────────────────────────────────────── */

.lib-card{
  cursor: pointer;
  height: 100%;
}

.lib-card-inner{
  display:flex;
  flex-direction:column;
  height: 100%;
}

/* Fixed cover region height so all cards align */
.lib-cover{
  padding: 0.9rem 0.9rem 0.25rem;
  height: 190px;
  display:flex;
}

/* Ensure Vuetify v-img fills the cover area */
.lib-cover :deep(.v-img){
  width: 100%;
  height: 100%;
}

/* Placeholder matches fixed cover height */
.lib-cover-placeholder{
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 1px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:center;
  color: var(--text-muted);
  background: rgba(220, 201, 182, 0.12);
}

.lib-cover-placeholder-lg{
  height:240px;
}

/* Meta area: keep consistent height */
.lib-meta{
  padding: 0.35rem 0.9rem 1rem;
  min-height: 86px;
}

/* Clamp (2 lines) — title */
.lib-book-title{
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--coffee-bean);
  line-height: 1.15;

  /* fallback */
  overflow: hidden;
  text-overflow: ellipsis;

  /* modern-ish clamp (works where supported) */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Clamp (1 line) — author */
.lib-meta .gp-small{
  /* fallback */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* webkit clamp (optional — doesn’t hurt) */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* (Removed from card preview; keep class if you re-use elsewhere)
.lib-scheduled{
  margin-top: 0.45rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}
*/

.lib-modal-title{
  font-family: var(--font-display);
  font-weight: 900;
}

.lib-kv{
  display:flex;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}

.lib-k{
  width: 110px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  font-weight: 700;
}

.lib-v{
  flex: 1;
  color: var(--text-base);
}

.lib-dates{
  display:flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.lib-date-chip{
  display:inline-flex;
  align-items:center;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid var(--border);
  background: rgba(220, 201, 182, 0.12);
  font-size: 0.82rem;
  color: var(--coffee-bean);
}

.lib-desc{
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.lib-desc-title{
  font-family: var(--font-display);
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--coffee-bean);
}

.lib-desc-text{
  white-space: pre-wrap;
  color: var(--text-base);
  line-height: 1.55;
}
</style>

<style src="~/assets/group-profile.css" />