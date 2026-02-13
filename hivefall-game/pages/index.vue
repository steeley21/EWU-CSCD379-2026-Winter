<!-- pages/index.vue -->
<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">

        <!-- Hero -->
        <v-card class="hf-glass hf-accent-border hf-accent-glow hf-hero" variant="flat">
          <v-card-title class="text-h5 hf-text-neon">Hivefall</v-card-title>
          <v-card-text class="text-body-1 hf-muted">
            A turn-based ASCII-grid survival game. Move carefully—each step advances the world.
          </v-card-text>

          <v-card-actions class="ga-2">
            <v-btn color="primary" variant="tonal" to="/hivefall">Start Game</v-btn>
            <v-btn variant="text" to="/leaderboard">View Leaderboard</v-btn>
          </v-card-actions>
        </v-card>

        <!-- How to play -->
        <v-card class="hf-glass--soft hf-accent-border" variant="flat">
          <v-card-title class="text-h6">How to play</v-card-title>
          <v-card-text class="hf-muted">
            <ul class="pl-5">
              <li>Move 1 tile per input (Arrow keys/WASD on desktop, D-pad on mobile).</li>
              <li>Enemies spawn from the edge and chase you as the game advances.</li>
              <li>Colliding with an enemy starts a fight: Run or Attack.</li>
              <li>After winning a fight, choose <strong>Harvest</strong> (Food +1) or <strong>Acquire</strong> (enemy joins as an infected ally).</li>
              <li>Food can be used in combat to heal (+10). Weapons may drop on victory.</li>
              <li>Win once all enemies have spawned and none remain. Lose if your HP hits 0.</li>
            </ul>
          </v-card-text>
        </v-card>

        <!-- Reviews -->
        <v-card class="hf-glass hf-accent-border" variant="flat">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-h6">Reviews</div>

            <v-btn variant="text" to="/reviews">
              View all
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Summary -->
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
              <div class="d-flex align-center ga-2">
                <v-rating :model-value="avgDisplay" readonly density="compact" />
                <span class="hf-muted text-body-2">
                  {{ totalCount }} total
                </span>
              </div>

              <div class="hf-muted text-body-2">
                Hivefall accepts <strong>5-star</strong> reviews only. Totally fair system.
              </div>
            </div>

            <!-- Load state -->
            <div v-if="reviewsLoading" class="d-flex align-center ga-3">
              <v-progress-circular indeterminate />
              <span class="hf-muted">Loading reviews…</span>
            </div>

            <v-alert
              v-else-if="reviewsWarming"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              Reviews are waking up. Try again in a moment.
            </v-alert>

            <div v-else-if="reviewsError" class="hf-muted mb-4">
              {{ reviewsError }}
              <div class="mt-2">
                <v-btn size="small" variant="outlined" @click="loadReviews">
                  Retry
                </v-btn>
              </div>
            </div>

            <!-- Submit form -->
            <div class="text-subtitle-2 mb-2">Leave a review</div>

            <v-text-field
              v-model="nameInput"
              label="Name (optional)"
              variant="outlined"
              density="comfortable"
              maxlength="32"
              counter="32"
              hide-details="auto"
              :disabled="submitting"
            />

            <div class="d-flex align-center ga-2 mt-2">
              <div class="hf-muted text-body-2">Rating</div>
              <v-rating :model-value="5" readonly density="compact" />
              <span class="hf-muted text-body-2">(locked)</span>
            </div>

            <v-textarea
              v-model="commentInput"
              class="mt-3"
              label="Comment (optional)"
              variant="outlined"
              density="comfortable"
              maxlength="280"
              counter="280"
              rows="3"
              auto-grow
              hide-details="auto"
              :disabled="submitting"
            />

            <div class="d-flex align-center ga-2 mt-3">
              <v-btn
                color="primary"
                variant="tonal"
                :loading="submitting"
                :disabled="submitting"
                @click="submit"
              >
                Submit 5-star review
              </v-btn>

              <span v-if="submitted" class="hf-muted">Submitted! 🎉</span>
            </div>

            <div v-if="submitError" class="hf-muted mt-2">
              {{ submitError }}
            </div>

            <v-divider class="my-5" />

            <!-- Top 5 list -->
            <div class="text-subtitle-2 mb-2">Top reviews</div>

            <div v-if="!reviewsLoading && reviews.length === 0" class="hf-muted">
              No reviews yet. Be the first!
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

const { getReviews, submitReview } = useHivefallApi()

const reviewsLoading = ref(true)
const reviewsWarming = ref(false)
const reviewsError = ref<string | null>(null)

const reviews = ref<ReviewDto[]>([])
const totalCount = ref(0)
const averageRating = ref(0)

const avgDisplay = computed(() => (averageRating.value > 0 ? averageRating.value : 0))

function formatUtc(iso: string): string {
  const d = new Date(iso)
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

async function loadReviews() {
  reviewsLoading.value = true
  reviewsWarming.value = false
  reviewsError.value = null

  try {
    const res = await getReviews(5)
    reviews.value = res.reviews
    totalCount.value = res.totalCount
    averageRating.value = res.averageRating
  } catch (e) {
    const status = getHttpStatus(e)
    if (status === 503) {
      reviewsWarming.value = true
      reviewsError.value = getApiMessage(e) ?? 'Reviews are waking up. Please try again.'
    } else {
      reviewsError.value = getApiMessage(e) ?? 'Failed to load reviews.'
    }
  } finally {
    reviewsLoading.value = false
  }
}

/* Submit */
const reviewNameCookie = useCookie<string>('hf-review-name', { default: () => '' })
const nameInput = ref(reviewNameCookie.value || '')
const commentInput = ref('')

const submitting = ref(false)
const submitted = ref(false)
const submitError = ref<string | null>(null)

async function submit() {
  if (submitting.value) return

  submitting.value = true
  submitted.value = false
  submitError.value = null

  const nameTrimmed = (nameInput.value || '').trim().slice(0, 32)
  const finalName = nameTrimmed.length ? nameTrimmed : 'Anonymous'

  const commentTrimmed = (commentInput.value || '').trim().slice(0, 280)
  const finalComment = commentTrimmed.length ? commentTrimmed : null

  // persist name for convenience
  reviewNameCookie.value = finalName
  nameInput.value = finalName

  try {
    await submitReview({
      name: finalName,
      rating: 5,
      comment: finalComment,
    })

    submitted.value = true
    commentInput.value = ''
    await loadReviews()
  } catch (e) {
    const status = getHttpStatus(e)
    const apiMsg = getApiMessage(e)

    if (status === 503) {
      submitError.value = apiMsg ?? 'Reviews are waking up. Try again in a moment.'
    } else {
      submitError.value = apiMsg ?? 'Failed to submit review. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadReviews)
</script>
