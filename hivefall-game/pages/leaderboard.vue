<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">

        <div class="text-h5 hf-text-neon">Leaderboard</div>

        <v-card class="hf-glass--soft hf-accent-border" variant="flat">
          <v-card-title class="text-h6">Coming soon</v-card-title>
          <v-card-text class="hf-muted">
            This page will eventually show player stats and top runs.
          </v-card-text>
        </v-card>

        <v-card class="hf-glass hf-accent-border" variant="flat">
          <v-card-title class="text-h6">Mock list (placeholder)</v-card-title>
          <v-card-text>
            <v-list density="comfortable" class="hf-list">
              <v-list-item v-for="row in mockRows" :key="row.rank">
                <v-list-item-title>
                  #{{ row.rank }} — {{ row.name }}
                </v-list-item-title>
                <v-list-item-subtitle class="hf-muted">
                  {{ row.result }} • Infected {{ row.infected }}/10 • Time {{ row.time }}
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
type LeaderboardRow = {
  rank: number
  name: string
  result: 'Win' | 'Loss'
  infected: number
  time: string
}

const mockRows: LeaderboardRow[] = [
  { rank: 1, name: 'Smiley', result: 'Win', infected: 10, time: '02:11' },
  { rank: 2, name: 'Probe-Unit', result: 'Win', infected: 10, time: '02:48' },
  { rank: 3, name: 'Crashling', result: 'Loss', infected: 7, time: '03:10' },
]
</script>
