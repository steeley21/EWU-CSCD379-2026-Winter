<template>
  <v-container fluid class="py-6">
    <v-row justify="center">
      <v-col cols="12" sm="11" md="9" lg="7" xl="6" class="d-flex flex-column ga-6">

        <!-- Hero -->
        <v-card>
          <v-card-title class="text-h5">Smiley’s Hivefall</v-card-title>
          <v-card-text class="text-body-1">
            You are Smiley — an alien crash survivor. Infect every enemy to expand the hive mind.
          </v-card-text>

          <v-card-actions class="ga-2">
            <v-btn color="primary" to="/hivefall">Start Game</v-btn>
            <v-btn variant="text" to="/leaderboard">View Leaderboard</v-btn>
          </v-card-actions>
        </v-card>

        <!-- How to play -->
        <v-card>
          <v-card-title class="text-h6">How to play</v-card-title>
          <v-card-text>
            <ul class="pl-5">
              <li>Move one tile at a time (arrow keys / mobile D-pad).</li>
              <li>Enemies trigger combat. Win to infect them.</li>
              <li>Resources upgrade stats and unlock new attack options.</li>
              <li>Win by infecting all enemies. Lose if Smiley dies.</li>
            </ul>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts"></script>
