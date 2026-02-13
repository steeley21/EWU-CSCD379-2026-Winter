<!-- pages/reviews.vue -->
<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h5 hf-text-neon">Reviews</div>
            <div class="hf-muted text-body-2 mt-1">
              Totally objective testimonials. Definitely not biased toward 5 stars.
            </div>
          </div>

          <v-btn
            size="small"
            variant="outlined"
            class="hf-accent-border"
            :loading="loading"
            @click="load"
          >
            Refresh
          </v-btn>
        </div>

        <v-card class="hf-glass hf-accent-border" variant="flat">
          <v-card-title class="text-h6 d-flex align-center justify-space-between">
            <span>All reviews</span>

            <div class="d-flex align-center ga-2">
              <v-rating :model-value="avgDisplay" readonly density="compact" />
              <span class="hf-muted text-body-2">
                {{ totalCount }} total
              </span>
            </div>
          </v-card-title>

          <v-card-text>
            <div v-if="loading" class="d-flex align-center ga-3">
              <v-progress-circular indeterminate />
              <span class="hf-muted">Loading reviews…</span>
            </div>

            <v-alert v-else-if="warming" type="info" variant="tonal" class="mb-4">
              Reviews are waking up. Try again in a moment.
            </v-alert>

            <div v-else-if="error" class="hf-muted">{{ error }}</div>

            <div v-else-if="reviews.length === 0" class="hf-muted">
              No reviews yet. Be the first to leave an extremely unbiased 5-star review.
            </div>

            <v-list v-else density="comfortable" class="hf-list">
              <v-list-item v-for="r in reviews" :key="r.id">
                <v-list-item-title class="d-flex align-center justify-space-between">
                  <span>{{ r.name }}</span>
                  <v-rating :model-value="r.rating" readonly density="compact" />
                </v-list-item-title>

                <v-list-item-subtitle class="hf-muted">
                  <span v-if="r.comment">{{ r.comment }}</span>
                  <span v-else><em>No comment.</em></span>
                  • {{ formatUtc(r.createdAtUtc) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios'
import type { ReviewDto } from '~/composables/useHivefallApi'

const { getReviews } = useHivefallApi()

const loading = ref(true)
const warming = ref(false)
const error = ref<string | null>(null)

const reviews = ref<ReviewDto[]>([])
const totalCount = ref(0)
const averageRating = ref(0)

const avgDisplay = computed(() => (averageRating.value > 0 ? averageRating.value : 0))

function formatUtc(iso: string): string {
  const s = /Z$|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function getHttpStatus(e: unknown): number | null {
  if (!axios.isAxiosError(e)) return null
  return e.response?.status ?? null
}

function getApiMessage(e: unknown): string | null {
  if (!axios.isAxiosError(e)) return null
  const data = e.response?.data as any
  const msg = data?.message
  return typeof msg === 'string' ? msg : null
}

async function load() {
  loading.value = true
  warming.value = false
  error.value = null

  try {
    const res = await getReviews(100)
    reviews.value = res.reviews
    totalCount.value = res.totalCount
    averageRating.value = res.averageRating
  } catch (e) {
    const status = getHttpStatus(e)
    if (status === 503) {
      warming.value = true
      error.value = getApiMessage(e) ?? 'Reviews are waking up. Please try again.'
    } else {
      error.value = getApiMessage(e) ?? 'Failed to load reviews.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
