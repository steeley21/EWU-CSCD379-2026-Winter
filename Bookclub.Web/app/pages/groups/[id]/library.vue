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
        <v-card class="bc-card lib-shell" rounded="lg">
          <div class="lib-head">
            <div>
              <div class="lib-title">
                Library <span class="gp-count">({{ groupBooks.length }})</span>
              </div>
              <div class="gp-sub">Click a book to view details.</div>
            </div>

            <div class="lib-controls">
              <v-select
                v-model="sortMode"
                :items="sortItems"
                label="Sort"
                variant="outlined"
                density="comfortable"
                hide-details
                class="lib-sort"
              />
            </div>
          </div>

          <v-card-text>
            <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />

            <v-alert v-else-if="pageError" type="error" variant="tonal">
              {{ pageError }}
            </v-alert>

            <div v-else-if="groupBooks.length === 0" class="gp-muted">
              No books added to this group yet.
            </div>

            <v-row v-else class="lib-grid align-stretch" dense>
              <v-col
                v-for="gb in sortedGroupBooks"
                :key="gb.gbId"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card class="bc-card lib-card" rounded="lg" @click="openBook(gb)">
                  <div class="lib-card-inner">
                    <div class="lib-cover">
                      <BookCover :book="gb.book" size="M" :icon-size="18" />
                    </div>

                    <div class="lib-meta">
                      <div class="lib-book-title">{{ String(gb.book.title ?? 'Untitled') }}</div>
                      <div class="gp-muted gp-small">{{ authorLabel(gb.book) }}</div>

                      <div class="mt-2">
                        <BookRatingSummary :avg="gb.avgRating ?? null" :count="gb.reviewCount ?? 0" />
                      </div>
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
      <v-card class="bc-card bc-static" rounded="lg">
        <v-card-title class="lib-modal-title">
          {{ selectedBook?.title ?? 'Book' }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <div class="lib-modal-cover">
                <BookCover :book="selectedBook" size="L" :icon-size="22" />
              </div>
            </v-col>

            <v-col cols="12" sm="8">
              <div class="lib-kv">
                <div class="lib-k">Author</div>
                <div class="lib-v">{{ selectedBook ? authorLabel(selectedBook) : '—' }}</div>
              </div>

              <div class="lib-kv">
                <div class="lib-k">Publish year</div>
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

          <div class="lib-desc">
            <div class="lib-desc-title">Reviews</div>

            <BookRatingSummary
              :avg="selectedGb?.avgRating ?? null"
              :count="selectedGb?.reviewCount ?? 0"
            />

            <v-progress-linear
              v-if="reviewsLoading"
              indeterminate
              color="var(--camel)"
              class="my-2"
            />

            <v-alert v-else-if="reviewsError" type="error" variant="tonal" class="my-2">
              {{ reviewsError }}
            </v-alert>

            <div v-else>
              <div class="mt-3 lib-section-head">
                Your review
              </div>

              <!-- Read-only view when a review exists and not editing -->
              <div v-if="myReview && !editingMine">
                <v-card class="bc-card bc-static" rounded="lg" variant="outlined">
                  <v-card-text>
                    <div class="yr-head">
                      <div class="yr-rating">
                        <v-rating :model-value="myReview.rating" readonly half-increments density="compact" />
                        <span class="yr-num">{{ Number(myReview.rating).toFixed(2) }}</span>
                      </div>

                      <div class="yr-meta">
                        Updated {{ formatShortDate(myReview.updatedAt) }}
                      </div>
                    </div>

                    <div v-if="myReview.comment" class="yr-comment">
                      {{ myReview.comment }}
                    </div>

                    <div v-else class="gp-muted gp-small">
                      No comment.
                    </div>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="editingMine = true">Edit</v-btn>
                    <v-btn
                      variant="text"
                      :disabled="reviewSaving"
                      @click="onDeleteMine"
                    >
                      Delete
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </div>

              <!-- Edit mode -->
              <div v-else>
                <div v-if="myReview" class="d-flex justify-end mb-2">
                  <v-btn variant="text" @click="editingMine = false">Cancel</v-btn>
                </div>

                <BookReviewEditor
                  :initial-rating="myReview?.rating ?? null"
                  :initial-comment="myReview?.comment ?? ''"
                  :saving="reviewSaving"
                  :can-delete="!!myReview"
                  @save="onSaveReview"
                  @delete="onDeleteMine"
                />
              </div>

              <div class="mt-4 lib-section-head">
                Member reviews
              </div>

              <BookReviewList
                :reviews="otherReviews"
                :can-moderate="canModerate"
                @moderate-delete="onModerateDelete"
              />
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
import type { BookDto, GroupBookDto, UpsertGroupBookReviewDto } from '~/types/dtos'
import { authorLabel, publishDateLabel } from '~/utils/books'
import { useGroupLibraryData } from '~/composables/useGroupLibraryData'
import { useOpenLibraryDescription } from '~/composables/useOpenLibraryDescription'
import { useGroupBookReviews } from '~/composables/useGroupBookReviews'

import BookCover from '~/components/common/BookCover.vue'
import BookRatingSummary from '~/components/groups/BookRatingSummary.vue'
import BookReviewEditor from '~/components/groups/BookReviewEditor.vue'
import BookReviewList from '~/components/groups/BookReviewList.vue'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const route = useRoute()

const groupId = computed(() => Number(route.params.id))

const { group, groupBooks, loading, pageError, scheduledDates, loadAll } = useGroupLibraryData()

// Sort
type SortMode = 'recent' | 'title' | 'author'
const sortMode = ref<SortMode>('recent')
const sortItems = [
  { title: 'Recently added', value: 'recent' },
  { title: 'Title (A–Z)', value: 'title' },
  { title: 'Author (A–Z)', value: 'author' },
]

const sortedGroupBooks = computed<GroupBookDto[]>(() => {
  const list = [...(groupBooks.value ?? [])]

  const byTitle = (a: GroupBookDto, b: GroupBookDto) =>
    String(a.book?.title ?? '').localeCompare(String(b.book?.title ?? ''), undefined, { sensitivity: 'base' })

  const byAuthor = (a: GroupBookDto, b: GroupBookDto) =>
    authorLabel(a.book).localeCompare(authorLabel(b.book), undefined, { sensitivity: 'base' })

  if (sortMode.value === 'title') {
    return list.sort((a, b) => byTitle(a, b) || (b.gbId - a.gbId))
  }
  if (sortMode.value === 'author') {
    return list.sort((a, b) => byAuthor(a, b) || byTitle(a, b) || (b.gbId - a.gbId))
  }
  // recent (default): gbId desc as “recently added” proxy
  return list.sort((a, b) => (b.gbId - a.gbId))
})

// dialog state
const detailsOpen = ref(false)
const selectedGb = ref<GroupBookDto | null>(null)
const selectedBook = computed<BookDto | null>(() => selectedGb.value?.book ?? null)

// OpenLibrary description (shared)
const { description, loading: descLoading, reset: resetDesc, loadForBook } = useOpenLibraryDescription()

// Reviews
const {
  otherReviews,
  myReview,
  loading: reviewsLoading,
  error: reviewsError,
  reset: resetReviews,
  load: loadReviews,
  saveMine,
  deleteMine,
  moderateDelete,
} = useGroupBookReviews()

const reviewSaving = ref(false)
const editingMine = ref(false)

const canModerate = computed(() =>
  auth.isAdmin || (!!group.value?.adminId && group.value.adminId === auth.userId)
)

async function openBook(gb: GroupBookDto) {
  if (!Number.isFinite(groupId.value) || groupId.value <= 0) return

  selectedGb.value = gb
  detailsOpen.value = true

  resetDesc()
  resetReviews()

  if (gb.book) await loadForBook(gb.book)
  await loadReviews(groupId.value, gb.gbId)

  // If user already has a review: lock by default
  editingMine.value = !myReview.value
}

async function onSaveReview(payload: UpsertGroupBookReviewDto) {
  if (!selectedGb.value) return
  reviewSaving.value = true
  try {
    await saveMine(groupId.value, selectedGb.value.gbId, payload)

    await loadAll(groupId.value)

    const refreshed = groupBooks.value.find(x => x.gbId === selectedGb.value?.gbId)
    if (refreshed) selectedGb.value = refreshed

    // Lock after save
    editingMine.value = false
  } finally {
    reviewSaving.value = false
  }
}

async function onDeleteMine() {
  if (!selectedGb.value) return
  reviewSaving.value = true
  try {
    await deleteMine(groupId.value, selectedGb.value.gbId)
    await loadAll(groupId.value)

    const refreshed = groupBooks.value.find(x => x.gbId === selectedGb.value?.gbId)
    if (refreshed) selectedGb.value = refreshed

    // No review now → show editor
    editingMine.value = true
  } finally {
    reviewSaving.value = false
  }
}

async function onModerateDelete(reviewId: number) {
  if (!selectedGb.value) return
  await moderateDelete(groupId.value, selectedGb.value.gbId, reviewId)
  await loadAll(groupId.value)

  const refreshed = groupBooks.value.find(x => x.gbId === selectedGb.value?.gbId)
  if (refreshed) selectedGb.value = refreshed
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

function formatShortDate(iso: string): string {
  const t = Date.parse(String(iso))
  if (!Number.isFinite(t)) return String(iso)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(t))
}

onMounted(async () => {
  auth.hydrate()
  const id = Number(route.params.id)
  if (!Number.isFinite(id) || id <= 0) return
  await loadAll(id)
})

watch(() => route.params.id, async () => {
  const id = Number(route.params.id)
  if (Number.isFinite(id) && id > 0) await loadAll(id)
})

watch(detailsOpen, (open) => {
  if (!open) {
    selectedGb.value = null
    resetDesc()
    resetReviews()
    editingMine.value = false
  }
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

.lib-controls{
  display:flex;
  align-items:center;
  gap:0.75rem;
}

.lib-sort{
  min-width: 210px;
}

.lib-title{
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}

.lib-grid{ margin-top: 0.25rem; }

.lib-card{
  cursor: pointer;
  height: 100%;
}

.lib-card-inner{
  display:flex;
  flex-direction:column;
  height: 100%;
}

.lib-cover{
  padding: 0.9rem 0.9rem 0.25rem;
  display:flex;
}

.lib-meta{
  padding: 0.35rem 0.9rem 1rem;
  min-height: 86px;
}

.lib-book-title{
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--coffee-bean);
  line-height: 1.15;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.lib-meta .gp-small{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

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

.lib-section-head{
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--coffee-bean);
}

.yr-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:1rem;
}

.yr-rating{
  display:flex;
  align-items:center;
  gap:0.4rem;
}

.yr-num{
  color: var(--text-muted);
  font-size: 0.9rem;
}

.yr-meta{
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.yr-comment{
  margin-top: 0.6rem;
  color: var(--text-base);
  white-space: pre-wrap;
}

/* Don't let the big container card "lift" on hover */
.lib-shell {
  transform: none !important;
}
.lib-shell:hover {
  transform: none !important;
}
</style>

<style src="~/assets/group-profile.css" />