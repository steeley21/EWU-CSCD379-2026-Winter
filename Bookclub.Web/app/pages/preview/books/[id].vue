<!-- app/pages/preview/books/[id].vue -->
<template>
  <div class="detail-page">
    <NuxtLink to="/preview/books" class="back-link">← Back to Book Preview</NuxtLink>

    <v-progress-linear v-if="pending" indeterminate color="var(--camel)" class="mb-4" />

    <v-alert v-else-if="pageError" type="error" variant="tonal" rounded="lg" class="mb-4">
      {{ pageError }}
    </v-alert>

    <div v-else-if="book" class="content">
      <div class="header">
        <div class="eyebrow">Preview</div>

        <h1 class="title">{{ String(book.title ?? 'Untitled') }}</h1>

        <div class="rating-row">
          <BookRatingSummary
            :avg="book.avgRating ?? null"
            :count="book.reviewCount ?? 0"
          />
        </div>

        <div class="sub">{{ authorLabel(book) }}</div>
      </div>

      <v-row class="detail-row" dense>
        <v-col cols="12" md="4">
          <div class="cover">
            <BookCover :book="book" size="L" :icon-size="22" />
          </div>
        </v-col>

        <v-col cols="12" md="8">
          <div class="kv">
            <div class="k">Author</div>
            <div class="v">{{ authorLabel(book) }}</div>
          </div>

          <div class="kv">
            <div class="k">Publish year</div>
            <div class="v">{{ publishYearLabel(book) ?? '—' }}</div>
          </div>

          <div class="kv">
            <div class="k">ISBN</div>
            <div class="v">{{ extractIsbn(book) ?? '—' }}</div>
          </div>

          <div class="desc">
            <div class="desc-title">Description</div>

            <v-progress-linear
              v-if="descLoading"
              indeterminate
              color="var(--camel)"
              class="mb-2"
            />

            <div v-else-if="!description" class="muted">No description available.</div>
            <div v-else class="desc-text">{{ description }}</div>
          </div>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBookPreviewDetail } from '~/composables/useBookPreviewDetail'
import { authorLabel, extractIsbn, publishYearLabel } from '~/utils/books'
import BookCover from '~/components/common/BookCover.vue'
import BookRatingSummary from '~/components/groups/BookRatingSummary.vue'

const route = useRoute()
const bookId = computed(() => Number(route.params.id))

const { book, pending, pageError, description, descLoading, refresh } = useBookPreviewDetail(bookId)

// helps avoid “stale rating” when navigating back to the same book
onMounted(() => {
  refresh()
})
</script>

<style scoped>
.detail-page{
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem clamp(1.5rem, 5vw, 4rem) 3rem;
}

.back-link{
  display: inline-block;
  margin-bottom: 1rem;
  color: var(--text-muted);
  text-decoration: none;
}
.back-link:hover{ color: var(--coffee-bean); }

.header{
  margin-bottom: 1.25rem;
}

.eyebrow{
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--dusty-olive);
}

.title{
  font-family: var(--font-display);
  color: var(--coffee-bean);
  font-weight: 900;
  margin: 0.35rem 0 0.25rem;
  line-height: 1.08;
}

.rating-row{
  margin: 0.25rem 0 0.35rem;
}

.sub{
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.detail-row{
  margin-top: 0.25rem;
}

.cover :deep(.v-img){
  border-radius: 16px;
}

.kv{
  display:flex;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
}
.k{
  width: 120px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  font-weight: 700;
}
.v{ flex: 1; color: var(--text-base); }

.desc{
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}
.desc-title{
  font-family: var(--font-display);
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: var(--coffee-bean);
}
.desc-text{
  white-space: pre-wrap;
  color: var(--text-base);
  line-height: 1.55;
}
.muted{ color: var(--text-muted); }
</style>