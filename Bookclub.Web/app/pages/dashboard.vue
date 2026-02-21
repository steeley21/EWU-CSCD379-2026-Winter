<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <div class="eyebrow">Welcome back</div>
        <h1 class="dashboard-title">{{ auth.username }}</h1>
        <p class="dashboard-sub">{{ auth.email }}</p>
      </div>

      <div class="header-badges">
        <span v-for="role in auth.roles" :key="role" class="role-badge">
          {{ role }}
        </span>
      </div>
    </div>

    <!-- Stats row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-label">My Library</div>
          <div class="stat-value">—</div>
        </div>
      </v-col>
      <v-col cols="12" sm="4">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-label">My Groups</div>
          <div class="stat-value">—</div>
        </div>
      </v-col>
      <v-col cols="12" sm="4">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-label">Upcoming Meetings</div>
          <div class="stat-value">—</div>
        </div>
      </v-col>
    </v-row>

    <!-- Quick actions -->
    <v-card class="bc-card mb-6" rounded="lg">
      <v-card-title class="section-card-title">Quick Actions</v-card-title>
      <v-card-text>
        <div class="actions-grid">
          <button class="action-tile" @click="navigateTo('/books')">
            <span class="action-icon">🔍</span>
            <span class="action-label">Browse Books</span>
          </button>
          <button class="action-tile" @click="navigateTo('/groups')">
            <span class="action-icon">👥</span>
            <span class="action-label">Find a Group</span>
          </button>
          <button class="action-tile" @click="navigateTo('/library')">
            <span class="action-icon">📖</span>
            <span class="action-label">My Library</span>
          </button>
          <button class="action-tile" @click="navigateTo('/meetings')">
            <span class="action-icon">📅</span>
            <span class="action-label">Meetings</span>
          </button>
        </div>
      </v-card-text>
    </v-card>

    <!-- Account info -->
    <v-card class="bc-card" rounded="lg">
      <v-card-title class="section-card-title">Account Info</v-card-title>
      <v-card-text>
        <div class="info-row">
          <span class="info-label">Username</span>
          <span class="info-value">{{ auth.username }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ auth.email }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">User ID</span>
          <span class="info-value muted">{{ auth.userId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Roles</span>
          <span class="info-value">{{ auth.roles.join(', ') || 'Member' }}</span>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
auth.hydrate()
</script>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem);
}

/* ── Header ── */
.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 0.35rem;
}

.dashboard-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--coffee-bean);
  line-height: 1.1;
}

.dashboard-sub {
  font-size: 0.9375rem;
  color: rgba(0,0,0,0.45);
  margin-top: 0.25rem;
}

.header-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.25rem;
}

.role-badge {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--pale-oak);
  color: var(--coffee-bean);
  border: 1px solid var(--camel);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
}

/* ── Stat cards ── */
.stat-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100%;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--dusty-olive);
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--coffee-bean);
  line-height: 1;
}

/* ── Section card title ── */
.section-card-title {
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em !important;
  color: var(--coffee-bean) !important;
  padding-bottom: 0 !important;
}

/* ── Quick actions grid ── */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.action-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--pale-oak);
  background: #fdf9f6;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
  text-align: center;
}

.action-tile:hover {
  background: var(--pale-oak);
  border-color: var(--camel);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.action-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--coffee-bean);
}

/* ── Account info ── */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--dusty-olive);
}

.info-value {
  font-size: 0.9375rem;
  color: var(--coffee-bean);
  font-weight: 500;
}

.info-value.muted {
  font-size: 0.8rem;
  color: rgba(0,0,0,0.35);
  font-family: monospace;
}
</style>