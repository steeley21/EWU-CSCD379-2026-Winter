<!-- pages/leaderboard.vue -->
<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">

        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h5 hf-text-neon">Leaderboard</div>
            <div class="hf-muted text-body-2 mt-1">
              Sorted by wins first, then fewer moves, then most recent.
            </div>
          </div>

          <v-btn
            size="small"
            variant="outlined"
            class="hf-accent-border"
            :loading="loading"
            @click="load({ force: true })"
          >
            Refresh
          </v-btn>
        </div>

        <v-card class="hf-glass hf-accent-border" variant="flat">
          <v-card-title class="text-h6">Top runs</v-card-title>

          <v-card-text>
            <!-- Loading / warming -->
            <div v-if="loading" class="d-flex align-center ga-3">
              <v-progress-circular indeterminate />
              <span class="hf-muted">{{ loadingLabel }}</span>
            </div>

            <!-- Warming message -->
            <v-alert
              v-else-if="warming"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <div class="d-flex flex-column ga-1">
                <div>
                  Leaderboard is waking up (serverless database cold start).
                </div>
                <div class="text-body-2">
                  Retrying in <strong>{{ retryIn }}</strong>s
                  <span v-if="retryAttempt > 0">
                    (attempt {{ retryAttempt }} of {{ maxRetries }})
                  </span>.
                </div>

                <div class="d-flex ga-2 mt-2">
                  <v-btn size="small" variant="outlined" @click="load({ force: true })">
                    Retry now
                  </v-btn>
                  <v-btn size="small" variant="text" @click="cancelRetries">
                    Stop retrying
                  </v-btn>
                </div>
              </div>
            </v-alert>

            <!-- Error -->
            <div v-else-if="error" class="hf-muted">
              {{ error }}
            </div>

            <!-- Empty -->
            <div v-else-if="entries.length === 0" class="hf-muted">
              No runs yet. Finish a game and submit a score!
            </div>

            <!-- List -->
            <v-list v-else density="comfortable" class="hf-list">
              <v-list-item v-for="(row, index) in entries" :key="row.id">
                <v-list-item-title>
                  #{{ index + 1 }} — {{ row.playerName }}
                </v-list-item-title>

                <v-list-item-subtitle class="hf-muted">
                  {{ row.won ? 'Win' : 'Loss' }}
                  • Moves {{ row.moveCount }}
                  • Infected {{ row.infectedCount }}
                  • {{ formatUtc(row.finishedAtUtc) }}
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
import type { RunResultDto } from '~/composables/useHivefallApi'

const { getLeaderboard } = useHivefallApi()

const loading = ref(true)
const warming = ref(false)
const error = ref<string | null>(null)
const entries = ref<RunResultDto[]>([])

const retryAttempt = ref(0)
const retryIn = ref(0)
const maxRetries = 6

let retryTimeout: ReturnType<typeof setTimeout> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

const backoffSeconds = [2, 3, 5, 8, 13, 13] // up to maxRetries tries

const loadingLabel = computed(() => {
  if (warming.value) return 'Waking up leaderboard…'
  return 'Loading leaderboard…'
})

function formatUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function clearTimers() {
  if (retryTimeout) {
    clearTimeout(retryTimeout)
    retryTimeout = null
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function cancelRetries() {
  clearTimers()
  warming.value = false
  retryIn.value = 0
  retryAttempt.value = 0
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

function startCountdown(seconds: number) {
  retryIn.value = seconds
  countdownInterval = setInterval(() => {
    retryIn.value = Math.max(0, retryIn.value - 1)
    if (retryIn.value === 0 && countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }, 1000)
}

async function load(opts: { force?: boolean } = {}) {
  // force means user clicked Refresh / Retry now
  if (opts.force) {
    cancelRetries()
  } else {
    // normal load should stop previous timers too
    clearTimers()
  }

  loading.value = true
  warming.value = false
  error.value = null

  try {
    const res = await getLeaderboard(25)
    entries.value = res.entries
    loading.value = false
    cancelRetries()
  } catch (e) {
    const status = getHttpStatus(e)

    // 503 = API says "waking up" (serverless SQL cold start)
    if (status === 503 && retryAttempt.value < maxRetries) {
      // keep any previously loaded entries instead of blanking the UI
      loading.value = false
      warming.value = true
      error.value = null

      retryAttempt.value += 1
      const wait = backoffSeconds[Math.min(retryAttempt.value - 1, backoffSeconds.length - 1)]

      clearTimers()
      startCountdown(wait)

      retryTimeout = setTimeout(() => {
        load()
      }, wait * 1000)

      return
    }

    // Other failures (or ran out of retries)
    loading.value = false
    warming.value = false

    const apiMsg = getApiMessage(e)
    if (status === 503) {
      error.value = apiMsg ?? 'Leaderboard is still waking up. Please try again.'
    } else {
      error.value = apiMsg ?? 'Failed to load leaderboard. Please try again.'
    }

    // Only clear entries if we never had good data
    if (entries.value.length === 0) {
      entries.value = []
    }
  }
}

onMounted(() => load())

onBeforeUnmount(() => {
  clearTimers()
})
</script>
