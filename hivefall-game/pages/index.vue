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

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>
