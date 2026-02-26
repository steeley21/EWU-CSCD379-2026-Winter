<template>
  <div class="my-lib-page">

    <!-- Ambient blobs -->
    <div class="my-lib-bg" aria-hidden="true">
      <div class="mlib-blob mlib-blob--1" />
      <div class="mlib-blob mlib-blob--2" />
    </div>

    <!-- Back -->
    <button class="mlib-back-btn" @click="navigateTo('/dashboard')">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      Dashboard
    </button>

    <!-- Header -->
    <header class="mlib-header">
      <div class="mlib-eyebrow"><span class="mlib-eyebrow-dot" /> My Library</div>
      <h1 class="mlib-title">Personal Library</h1>
      <p class="mlib-sub">Track books you want to read, are reading, or have finished.</p>
    </header>

    <!-- Stats strip -->
    <div class="mlib-stats">
      <div class="mls" v-for="s in statusTabs" :key="s.value">
        <div class="mls-value">{{ countFor(s.value) }}</div>
        <div class="mls-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Add book bar -->
    <div class="mlib-add-bar">
      <div class="mlib-search-wrap">
        <svg class="mlib-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          class="mlib-search-input"
          placeholder="Search to add a book…"
          @input="onSearchInput"
          @focus="searchFocused = true"
          @blur="onSearchBlur"
        />
        <button v-if="searchQuery" class="mlib-search-clear" @click="clearSearch">✕</button>
      </div>

      <!-- Search results dropdown -->
      <div v-if="searchFocused && searchResults.length" class="mlib-search-dropdown">
        <button
          v-for="r in searchResults"
          :key="r.id ?? `${r.title}-${r.authorFirst}`"
          class="mlib-search-result"
          @mousedown.prevent="addFromSearch(r)"
        >
          <div class="mlib-sr-title">{{ r.title }}</div>
          <div class="mlib-sr-author">{{ r.authorFirst }} {{ r.authorLast }}</div>
          <span v-if="isInLibrary(r)" class="mlib-sr-badge">In library</span>
        </button>
      </div>
      <div v-if="searchFocused && searchQuery.length >= 2 && !searchResults.length && !searching" class="mlib-search-dropdown">
        <div class="mlib-sr-empty">No results found</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="mlib-skeletons">
      <div class="mlib-skeleton" v-for="n in 4" :key="n" />
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="mlib-error">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ fetchError }}
    </div>

    <div v-else class="mlib-body">
      <!-- Status tabs -->
      <div class="mlib-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="mlib-tab"
          :class="{ 'mlib-tab--active': activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
          <span v-if="countFor(tab.value)" class="mlib-tab-badge" :class="{ 'mlib-tab-badge--muted': activeTab !== tab.value }">
            {{ countFor(tab.value) }}
          </span>
        </button>
      </div>

      <!-- Sort -->
      <div class="mlib-sort-row">
        <span class="mlib-sort-label">Sort:</span>
        <button
          v-for="s in sortOptions"
          :key="s.value"
          class="mlib-sort-btn"
          :class="{ 'mlib-sort-btn--active': sortMode === s.value }"
          @click="sortMode = s.value"
        >
          {{ s.label }}
        </button>
      </div>

      <!-- Empty -->
      <div v-if="visibleBooks.length === 0" class="mlib-empty">
        <div class="mlib-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="mlib-empty-text">No books here yet</div>
        <p class="mlib-empty-sub">Search above to add books to your library.</p>
      </div>

      <!-- Book grid -->
      <div v-else class="mlib-grid">
        <div
          v-for="ub in visibleBooks"
          :key="ub.ubId"
          class="mlib-card"
          @click="openDetail(ub)"
        >
          <div class="mlib-card-cover">
            <BookCover :book="ub.book" size="M" :icon-size="16" />
          </div>
          <div class="mlib-card-body">
            <div class="mlib-card-title">{{ ub.book.title }}</div>
            <div class="mlib-card-author">{{ authorLabel(ub.book) }}</div>
            <div class="mlib-card-status-row">
              <span class="mlib-status-chip" :class="`mlib-status-chip--${ub.status}`">
                {{ statusLabel(ub.status) }}
              </span>
              <span v-if="ub.rating" class="mlib-rating-chip">★ {{ ub.rating.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail / Edit modal -->
    <div v-if="detailOpen && selectedUb" class="mlib-overlay" @click.self="closeDetail">
      <div class="mlib-modal">
        <div class="mlib-modal-header">
          <div class="mlib-modal-title">{{ selectedUb.book.title }}</div>
          <button class="mlib-modal-close" @click="closeDetail">✕</button>
        </div>

        <div class="mlib-modal-body">
          <div class="mlib-modal-top">
            <div class="mlib-modal-cover">
              <BookCover :book="selectedUb.book" size="L" :icon-size="22" />
            </div>
            <div class="mlib-modal-info">
              <div class="mlib-kv"><span class="mlib-k">Author</span><span class="mlib-v">{{ authorLabel(selectedUb.book) }}</span></div>
              <div class="mlib-kv" v-if="selectedUb.book.publishDate">
                <span class="mlib-k">Year</span>
                <span class="mlib-v">{{ new Date(selectedUb.book.publishDate).getFullYear() }}</span>
              </div>
              <div class="mlib-kv">
                <span class="mlib-k">Added</span>
                <span class="mlib-v">{{ formatDate(selectedUb.addedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Status selector -->
          <div class="mlib-field-group">
            <div class="mlib-field-label">Reading Status</div>
            <div class="mlib-status-btns">
              <button
                v-for="s in statusTabs"
                :key="s.value"
                class="mlib-status-select-btn"
                :class="{ 'mlib-status-select-btn--active': editStatus === s.value }"
                @click="editStatus = s.value"
              >
                {{ s.label }}
              </button>
            </div>
          </div>

          <!-- Rating -->
          <div class="mlib-field-group">
            <div class="mlib-field-label">Personal Rating <span class="mlib-field-optional">(optional)</span></div>
            <div class="mlib-star-row">
              <button
                v-for="n in 5"
                :key="n"
                class="mlib-star-btn"
                :class="{ 'mlib-star-btn--filled': editRating !== null && n <= editRating }"
                @click="toggleRating(n)"
              >★</button>
              <button v-if="editRating" class="mlib-rating-clear" @click="editRating = null">Clear</button>
            </div>
          </div>

          <!-- Description -->
          <div v-if="description || descLoading" class="mlib-desc-section">
            <div class="mlib-field-label">Description</div>
            <div v-if="descLoading" class="mlib-desc-loading">Loading…</div>
            <div v-else class="mlib-desc-text">{{ description }}</div>
          </div>

          <div v-if="updateError" class="mlib-modal-err">{{ updateError }}</div>
        </div>

        <div class="mlib-modal-footer">
          <button class="mlib-remove-btn" :disabled="saving" @click="removeBook">Remove</button>
          <div class="mlib-modal-footer-right">
            <button class="mlib-cancel-btn" @click="closeDetail">Cancel</button>
            <button class="mlib-save-btn" :disabled="saving" @click="saveDetail">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import BookCover from '~/components/common/BookCover.vue'
import { userLibraryService } from '~/services/userLibraryService'
import { useOpenLibraryDescription } from '~/composables/useOpenLibraryDescription'
import { authorLabel } from '~/utils/books'
import type { UserBookDto, ReadingStatus, BookSearchResultDto } from '~/types/dtos'
import { api } from '~/services/api'

definePageMeta({ middleware: 'auth' })

// ── Data ──────────────────────────────────────────────────────
const library   = ref<UserBookDto[]>([])
const loading   = ref(true)
const fetchError = ref('')

// ── Tabs / sort ───────────────────────────────────────────────
const statusTabs = [
  { label: 'Want to Read', value: 0 as ReadingStatus },
  { label: 'Reading',      value: 1 as ReadingStatus },
  { label: 'Finished',     value: 2 as ReadingStatus },
]
const sortOptions = [
  { label: 'Recently added', value: 'recent' },
  { label: 'Title',          value: 'title'  },
  { label: 'Rating',         value: 'rating' },
]
const activeTab = ref<ReadingStatus>(0)
const sortMode  = ref<'recent' | 'title' | 'rating'>('recent')

const countFor = (s: ReadingStatus) => library.value.filter(ub => ub.status === s).length

const visibleBooks = computed(() => {
  const list = library.value.filter(ub => ub.status === activeTab.value)
  if (sortMode.value === 'title') {
    return [...list].sort((a, b) => a.book.title!.localeCompare(b.book.title ?? ''))
  }
  if (sortMode.value === 'rating') {
    return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }
  // recent
  return [...list].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
})

// ── Search / add ──────────────────────────────────────────────
const searchQuery   = ref('')
const searchResults = ref<BookSearchResultDto[]>([])
const searchFocused = ref(false)
const searching     = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  if (searchQuery.value.length < 2) { searchResults.value = []; return }
  searchTimer = setTimeout(runSearch, 300)
}

async function runSearch() {
  searching.value = true
  try {
    const res = await api.get<BookSearchResultDto[]>('/api/books/search', {
      params: { q: searchQuery.value }
    })
    searchResults.value = Array.isArray(res.data) ? res.data : []
  } catch { searchResults.value = [] }
  finally { searching.value = false }
}

function onSearchBlur() {
  // small delay so mousedown on result fires first
  setTimeout(() => { searchFocused.value = false }, 150)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

function isInLibrary(r: BookSearchResultDto) {
  if (r.id) return library.value.some(ub => ub.book.id === r.id)
  return library.value.some(ub =>
    ub.book.title === r.title &&
    ub.book.authorFirst === r.authorFirst &&
    ub.book.authorLast === r.authorLast
  )
}

async function addFromSearch(r: BookSearchResultDto) {
  if (isInLibrary(r)) return

  try {
    let bookId = r.id

    // If from OpenLibrary, save to DB first
    if (!bookId) {
      const saved = await api.post<{ bId?: number; id?: number }>('/api/books/save-from-catalog', {
        title: r.title,
        authorFirst: r.authorFirst,
        authorLast: r.authorLast,
        isbn: r.isbn,
        publishYear: r.publishYear,
      })
      bookId = saved.data?.bId ?? saved.data?.id ?? null
    }

    if (!bookId) return

    const entry = await userLibraryService.add({ bId: bookId, status: 0 })
    if (entry) {
      library.value.unshift(entry)
      // switch to the WantToRead tab to show the newly added book
      activeTab.value = 0
    }
  } catch (e: any) {
    console.error('Could not add book', e)
  } finally {
    clearSearch()
    searchFocused.value = false
  }
}

// ── Detail modal ──────────────────────────────────────────────
const detailOpen  = ref(false)
const selectedUb  = ref<UserBookDto | null>(null)
const editStatus  = ref<ReadingStatus>(0)
const editRating  = ref<number | null>(null)
const saving      = ref(false)
const updateError = ref('')

const { description, loading: descLoading, reset: resetDesc, loadForBook } = useOpenLibraryDescription()

function openDetail(ub: UserBookDto) {
  selectedUb.value  = ub
  editStatus.value  = ub.status
  editRating.value  = ub.rating
  updateError.value = ''
  detailOpen.value  = true
  resetDesc()
  loadForBook(ub.book)
}

function closeDetail() {
  detailOpen.value = false
  selectedUb.value = null
  resetDesc()
}

function toggleRating(n: number) {
  editRating.value = editRating.value === n ? null : n
}

async function saveDetail() {
  if (!selectedUb.value) return
  saving.value = true
  updateError.value = ''
  try {
    const updated = await userLibraryService.update(selectedUb.value.ubId, {
      status: editStatus.value,
      rating: editRating.value,
    })
    if (updated) {
      const idx = library.value.findIndex(x => x.ubId === updated.ubId)
      if (idx !== -1) library.value[idx] = updated
    }
    closeDetail()
  } catch (e: any) {
    updateError.value = e?.response?.data?.message ?? 'Could not save changes.'
  } finally {
    saving.value = false
  }
}

async function removeBook() {
  if (!selectedUb.value) return
  saving.value = true
  try {
    await userLibraryService.remove(selectedUb.value.ubId)
    library.value = library.value.filter(x => x.ubId !== selectedUb.value!.ubId)
    closeDetail()
  } catch (e: any) {
    updateError.value = e?.response?.data?.message ?? 'Could not remove book.'
  } finally {
    saving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
function statusLabel(s: ReadingStatus) {
  return ['Want to Read', 'Reading', 'Finished'][s]
}

function formatDate(iso: string) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(t))
}

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
  try {
    library.value = await userLibraryService.getAll()
    // default to whichever tab has books
    if (countFor(0) === 0 && countFor(1) > 0) activeTab.value = 1
    else if (countFor(0) === 0 && countFor(1) === 0 && countFor(2) > 0) activeTab.value = 2
  } catch (e: any) {
    fetchError.value = e?.message ?? 'Could not load library.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.my-lib-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  position: relative;
  min-height: 100vh;
}

/* ── Background ── */
.my-lib-bg {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0; overflow: hidden;
}
.mlib-blob {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: 0.07;
}
.mlib-blob--1 { width: 400px; height: 400px; background: var(--camel, #a39171); top: -80px; right: -80px; }
.mlib-blob--2 { width: 300px; height: 300px; background: var(--coffee-bean, #6d4c3d); bottom: 10%; left: -60px; }
.my-lib-page > * { position: relative; z-index: 1; }

/* ── Back ── */
.mlib-back-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.84rem; font-weight: 600;
  color: var(--text-muted, #9e8c7e);
  background: transparent; border: none; cursor: pointer; padding: 0;
  margin-bottom: 1.25rem;
  transition: color 0.15s;
}
.mlib-back-btn svg { width: 15px; height: 15px; transition: transform 0.15s; }
.mlib-back-btn:hover { color: var(--coffee-bean, #6d4c3d); }
.mlib-back-btn:hover svg { transform: translateX(-3px); }

/* ── Header ── */
.mlib-eyebrow {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--camel, #a39171); margin-bottom: 0.35rem;
}
.mlib-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--camel, #a39171); display: inline-block; }
.mlib-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 900; color: var(--coffee-bean, #6d4c3d); margin: 0 0 0.3rem; line-height: 1.1; }
.mlib-sub { color: var(--text-muted, #9e8c7e); font-size: 0.9rem; margin: 0 0 1.5rem; }

/* ── Stats ── */
.mlib-stats {
  display: flex; gap: 0;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 18px; padding: 0.9rem 1.5rem;
  margin-bottom: 1.25rem;
}
.mls { text-align: center; flex: 1; }
.mls + .mls { border-left: 1px solid var(--border, #e8ddd5); }
.mls-value { font-family: var(--font-display); font-size: 1.5rem; font-weight: 900; color: var(--coffee-bean, #6d4c3d); line-height: 1; margin-bottom: 0.2rem; }
.mls-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted, #9e8c7e); }

/* ── Add / search bar ── */
.mlib-add-bar { position: relative; margin-bottom: 1.5rem; z-index: 100; }
.mlib-search-wrap {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 14px; padding: 0.65rem 1rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.mlib-search-wrap:focus-within {
  border-color: var(--camel, #a39171);
  box-shadow: 0 0 0 3px rgba(163, 145, 113, 0.15);
}
.mlib-search-icon { width: 16px; height: 16px; color: var(--text-muted, #9e8c7e); flex-shrink: 0; }
.mlib-search-input {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: var(--font-body); font-size: 0.9rem; color: var(--text-body, #3d2b1f);
}
.mlib-search-input::placeholder { color: var(--text-muted, #9e8c7e); opacity: 0.7; }
.mlib-search-clear {
  background: transparent; border: none; cursor: pointer;
  color: var(--text-muted, #9e8c7e); font-size: 0.8rem; padding: 0;
  transition: color 0.15s;
}
.mlib-search-clear:hover { color: var(--coffee-bean, #6d4c3d); }

.mlib-search-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 14px; z-index: 200;
  box-shadow: 0 8px 32px rgba(109, 76, 61, 0.12);
  overflow: hidden;
}
.mlib-search-result {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; text-align: left; background: transparent; border: none;
  cursor: pointer; padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border, #e8ddd5);
  transition: background 0.12s;
}
.mlib-search-result:last-child { border-bottom: none; }
.mlib-search-result:hover { background: rgba(220, 201, 182, 0.2); }
.mlib-sr-title { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; color: var(--coffee-bean, #6d4c3d); flex: 1; }
.mlib-sr-author { font-size: 0.78rem; color: var(--text-muted, #9e8c7e); white-space: nowrap; }
.mlib-sr-badge {
  font-size: 0.68rem; font-weight: 700; color: var(--camel, #a39171);
  background: rgba(163, 145, 113, 0.15); border-radius: 999px; padding: 0.15rem 0.5rem; white-space: nowrap;
}
.mlib-sr-empty { padding: 0.9rem 1rem; font-size: 0.85rem; color: var(--text-muted, #9e8c7e); text-align: center; }

/* ── Tabs ── */
.mlib-tabs {
  display: flex; gap: 0.35rem; margin-bottom: 0.75rem;
  border-bottom: 1.5px solid var(--border, #e8ddd5);
}
.mlib-tab {
  font-family: var(--font-body); font-size: 0.88rem; font-weight: 600;
  color: var(--text-muted, #9e8c7e);
  background: transparent; border: none; cursor: pointer;
  padding: 0.55rem 1rem 0.7rem;
  border-bottom: 2.5px solid transparent; margin-bottom: -1.5px;
  display: flex; align-items: center; gap: 0.4rem;
  transition: color 0.15s, border-color 0.15s;
}
.mlib-tab--active { color: var(--coffee-bean, #6d4c3d); border-bottom-color: var(--coffee-bean, #6d4c3d); }
.mlib-tab-badge {
  font-size: 0.7rem; font-weight: 800;
  background: var(--coffee-bean, #6d4c3d); color: #fff;
  border-radius: 999px; padding: 0.1rem 0.45rem; line-height: 1.5;
}
.mlib-tab-badge--muted { background: var(--border, #e8ddd5); color: var(--text-muted, #9e8c7e); }

/* ── Sort ── */
.mlib-sort-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.mlib-sort-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted, #9e8c7e); text-transform: uppercase; letter-spacing: 0.1em; }
.mlib-sort-btn {
  font-size: 0.78rem; font-weight: 600; color: var(--text-muted, #9e8c7e);
  background: transparent; border: 1px solid var(--border, #e8ddd5);
  border-radius: 999px; padding: 0.2rem 0.7rem; cursor: pointer;
  transition: all 0.15s;
}
.mlib-sort-btn--active, .mlib-sort-btn:hover { color: var(--coffee-bean, #6d4c3d); border-color: var(--camel, #a39171); background: rgba(163, 145, 113, 0.08); }

/* ── Grid ── */
.mlib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.75rem;
}
.mlib-card {
  background: var(--surface, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 18px; overflow: hidden; cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.13s;
  animation: mCardIn 0.25s ease both;
}
@keyframes mCardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.mlib-card:hover { border-color: var(--camel, #a39171); box-shadow: 0 6px 24px rgba(109, 76, 61, 0.1); transform: translateY(-2px); }
.mlib-card-cover { padding: 0.85rem 0.85rem 0.3rem; }
.mlib-card-body { padding: 0.3rem 0.85rem 0.85rem; }
.mlib-card-title {
  font-family: var(--font-display); font-weight: 800; font-size: 0.9rem;
  color: var(--coffee-bean, #6d4c3d); line-height: 1.2; margin-bottom: 0.2rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.mlib-card-author { font-size: 0.74rem; color: var(--text-muted, #9e8c7e); margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mlib-card-status-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }

/* Status chips */
.mlib-status-chip { font-size: 0.65rem; font-weight: 700; border-radius: 999px; padding: 0.15rem 0.55rem; }
.mlib-status-chip--0 { background: rgba(163, 145, 113, 0.15); color: var(--camel, #a39171); }
.mlib-status-chip--1 { background: rgba(109, 76, 61, 0.1); color: var(--coffee-bean, #6d4c3d); }
.mlib-status-chip--2 { background: rgba(138, 158, 106, 0.18); color: #5a7a3a; }
.mlib-rating-chip { font-size: 0.7rem; font-weight: 700; color: var(--camel, #a39171); }

/* ── Skeletons ── */
.mlib-skeletons { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 0.75rem; }
.mlib-skeleton {
  height: 220px; border-radius: 18px;
  background: linear-gradient(90deg, var(--border, #e8ddd5) 25%, rgba(255,255,255,0.4) 50%, var(--border, #e8ddd5) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Error ── */
.mlib-error { display: flex; align-items: center; gap: 0.6rem; color: #b94a48; background: #fff5f5; border: 1px solid rgba(185,74,72,0.25); border-radius: 14px; padding: 0.85rem 1rem; font-size: 0.9rem; }
.mlib-error svg { width: 18px; height: 18px; flex-shrink: 0; }

/* ── Empty ── */
.mlib-empty { text-align: center; padding: 3rem 1rem; }
.mlib-empty-icon { width: 48px; height: 48px; margin: 0 auto 0.9rem; color: var(--pale-oak, #dcc9b6); }
.mlib-empty-icon svg { width: 100%; height: 100%; }
.mlib-empty-text { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--coffee-bean, #6d4c3d); margin-bottom: 0.35rem; }
.mlib-empty-sub { font-size: 0.84rem; color: var(--text-muted, #9e8c7e); }

/* ── Modal overlay ── */
.mlib-overlay {
  position: fixed; inset: 0;
  background: rgba(40, 20, 10, 0.45); backdrop-filter: blur(3px);
  z-index: 300; display: grid; place-items: center; padding: 1rem;
}
.mlib-modal {
  background: var(--bg, #fdf8f4);
  border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 22px; width: 100%; max-width: 560px;
  box-shadow: 0 20px 60px rgba(40, 20, 10, 0.22); overflow: hidden;
  max-height: 90vh; display: flex; flex-direction: column;
}
.mlib-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.2rem 1.4rem 0.75rem;
  border-bottom: 1px solid var(--border, #e8ddd5); flex-shrink: 0;
}
.mlib-modal-title { font-family: var(--font-display); font-weight: 900; font-size: 1.1rem; color: var(--coffee-bean, #6d4c3d); }
.mlib-modal-close { background: transparent; border: none; font-size: 0.85rem; color: var(--text-muted, #9e8c7e); cursor: pointer; padding: 0.25rem; transition: color 0.15s; }
.mlib-modal-close:hover { color: var(--coffee-bean, #6d4c3d); }
.mlib-modal-body { padding: 1.1rem 1.4rem; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 1rem; }
.mlib-modal-footer {
  padding: 0.9rem 1.4rem 1.2rem;
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid var(--border, #e8ddd5); flex-shrink: 0;
}
.mlib-modal-footer-right { display: flex; gap: 0.6rem; }

/* Modal top row */
.mlib-modal-top { display: flex; gap: 1rem; }
.mlib-modal-cover { flex-shrink: 0; width: 90px; }
.mlib-modal-info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; }
.mlib-kv { display: flex; gap: 0.75rem; }
.mlib-k { width: 60px; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted, #9e8c7e); font-weight: 700; flex-shrink: 0; }
.mlib-v { font-size: 0.88rem; color: var(--text-body, #3d2b1f); }

/* Field groups */
.mlib-field-group { display: flex; flex-direction: column; gap: 0.5rem; }
.mlib-field-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted, #9e8c7e); }
.mlib-field-optional { font-weight: 400; opacity: 0.7; text-transform: none; letter-spacing: 0; }

/* Status select buttons */
.mlib-status-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.mlib-status-select-btn {
  font-family: var(--font-body); font-size: 0.82rem; font-weight: 600;
  color: var(--text-muted, #9e8c7e);
  background: transparent; border: 1.5px solid var(--border, #e8ddd5);
  border-radius: 999px; padding: 0.38rem 0.9rem; cursor: pointer;
  transition: all 0.15s;
}
.mlib-status-select-btn--active {
  color: #fff; background: var(--coffee-bean, #6d4c3d); border-color: var(--coffee-bean, #6d4c3d);
}

/* Stars */
.mlib-star-row { display: flex; align-items: center; gap: 0.3rem; }
.mlib-star-btn {
  font-size: 1.4rem; background: transparent; border: none; cursor: pointer;
  color: var(--border, #e8ddd5); padding: 0; line-height: 1;
  transition: color 0.12s, transform 0.1s;
}
.mlib-star-btn--filled { color: var(--camel, #a39171); }
.mlib-star-btn:hover { transform: scale(1.15); }
.mlib-rating-clear {
  font-size: 0.75rem; font-weight: 600; color: var(--text-muted, #9e8c7e);
  background: transparent; border: none; cursor: pointer; margin-left: 0.25rem; text-decoration: underline;
}

/* Description */
.mlib-desc-section { border-top: 1px solid var(--border, #e8ddd5); padding-top: 0.9rem; }
.mlib-desc-loading { font-size: 0.82rem; color: var(--text-muted, #9e8c7e); }
.mlib-desc-text { font-size: 0.86rem; color: var(--text-body, #3d2b1f); line-height: 1.65; white-space: pre-wrap; max-height: 180px; overflow-y: auto; }

/* Modal error */
.mlib-modal-err { font-size: 0.82rem; color: #b94a48; background: #fff5f5; border: 1px solid rgba(185,74,72,0.25); border-radius: 10px; padding: 0.5rem 0.75rem; }

/* Footer buttons */
.mlib-remove-btn {
  font-size: 0.82rem; font-weight: 600; color: #b94a48;
  background: transparent; border: 1px solid rgba(185, 74, 72, 0.3);
  border-radius: 999px; padding: 0.45rem 1rem; cursor: pointer;
  transition: all 0.15s;
}
.mlib-remove-btn:hover:not(:disabled) { background: #fff5f5; }
.mlib-remove-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.mlib-cancel-btn {
  font-family: var(--font-body); font-size: 0.82rem; font-weight: 600; color: var(--text-muted, #9e8c7e);
  background: transparent; border: 1px solid var(--border, #e8ddd5);
  border-radius: 999px; padding: 0.45rem 1rem; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.mlib-cancel-btn:hover { border-color: var(--camel, #a39171); color: var(--coffee-bean, #6d4c3d); }
.mlib-save-btn {
  font-family: var(--font-body); font-size: 0.82rem; font-weight: 700; color: #fff;
  background: var(--coffee-bean, #6d4c3d); border: none;
  border-radius: 999px; padding: 0.45rem 1.2rem; cursor: pointer;
  transition: background 0.15s, transform 0.12s;
  box-shadow: 0 2px 10px rgba(109, 76, 61, 0.2);
}
.mlib-save-btn:hover:not(:disabled) { background: var(--camel, #a39171); transform: translateY(-1px); }
.mlib-save-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>