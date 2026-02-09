<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">

        <div class="d-flex align-center justify-space-between">
          <div class="text-h5 hf-text-neon">Leaderboard</div>

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

        <v-card class="hf-glass--soft hf-accent-border" variant="flat">
          <v-card-title class="text-h6">Coming soon</v-card-title>
          <v-card-text class="hf-muted">
            This page will eventually show player stats and top runs.
          </v-card-text>
        </v-card>

        <v-card class="hf-glass hf-accent-border" variant="flat">
          <v-card-title class="text-h6">Top runs</v-card-title>

          <v-card-text>
            <!-- Loading -->
            <div v-if="loading" class="d-flex align-center ga-3">
              <v-progress-circular indeterminate />
              <span class="hf-muted">Loading leaderboard…</span>
            </div>

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
              <v-list-item
                v-for="(row, index) in entries"
                :key="row.id"
              >
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
import type { RunResultDto } from '~/composables/useHivefallApi'

const { getLeaderboard } = useHivefallApi()

const loading = ref(true)
const error = ref<string | null>(null)
const entries = ref<RunResultDto[]>([])

function formatUtc(iso: string): string {
  // Keep it simple and readable in the UI
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

async function load() {
  loading.value = true
  error.value = null

  try {
    const res = await getLeaderboard(25)
    entries.value = res.entries
  } catch (e) {
    console.error('API call failed:', e)
    error.value = 'Failed to load leaderboard. Make sure the API is running.'
    entries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
