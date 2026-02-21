<template>
  <div class="dashboard">

    <!-- ── Header ── -->
    <div class="dashboard-header">
      <div class="eyebrow">Welcome back</div>
      <h1 class="dashboard-title">{{ auth.username }}</h1>
      <p class="dashboard-sub">{{ auth.email }}</p>
    </div>

    <!-- ── Stats Row ── -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">
          <!-- Book / library -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-label">My Library</div>
        <div class="stat-value">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <!-- Users / groups -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-label">My Groups</div>
        <div class="stat-value">{{ loading ? '—' : groups.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <!-- Calendar -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-label">Upcoming Meetings</div>
        <div class="stat-value">—</div>
      </div>
    </div>

    <!-- ── Quick Actions ── -->
    <div class="quick-actions-card">
      <div class="section-card-title">Quick Actions</div>
      <div class="actions-grid">
        <button class="action-tile" @click="navigateTo('/books')">
          <span class="action-icon">
            <!-- Search -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <span class="action-label">Browse Books</span>
        </button>
        <button class="action-tile" @click="navigateTo('/groups')">
          <span class="action-icon">
            <!-- Users -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span class="action-label">Find a Group</span>
        </button>
        <button class="action-tile" @click="navigateTo('/library')">
          <span class="action-icon">
            <!-- Open book -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </span>
          <span class="action-label">My Library</span>
        </button>
        <button class="action-tile" @click="navigateTo('/meetings')">
          <span class="action-icon">
            <!-- Calendar -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span class="action-label">Meetings</span>
        </button>
      </div>
    </div>

    <!-- ── My Groups ── -->
    <section class="groups-section">
      <div class="groups-header">
        <div class="groups-title-row">
          <h2 class="groups-title">My Groups</h2>
          <div class="groups-line" />
        </div>
        <button class="btn-create-group" @click="navigateTo('/groups/create')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Group
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="groups-loading">
        <div class="loading-bar" /><div class="loading-bar loading-bar--short" />
      </div>

      <!-- Fetch error -->
      <div v-else-if="fetchError" class="groups-fetch-error">{{ fetchError }}</div>

      <div v-else class="groups-grid">
        <!-- Populated state -->
        <template v-if="groups.length">
          <div
            v-for="group in groups"
            :key="group.groupID"
            class="group-card"
            @click="navigateTo(`/groups/${group.groupID}`)"
          >
            <div class="group-card-banner" />
            <div class="group-card-body">
              <div class="group-card-name">{{ group.groupName }}</div>
              <p class="group-card-desc">{{ group.adminFullName ? `Admin: ${group.adminFullName}` : 'No description yet.' }}</p>
              <div class="group-card-meta">
                <span class="group-meta-pill">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {{ group.memberCount }} member{{ group.memberCount !== 1 ? 's' : '' }}
                </span>
                <span class="group-card-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty state -->
        <div v-else class="groups-empty">
          <div class="groups-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="groups-empty-text">You're not in any groups yet</div>
          <p class="groups-empty-sub">
            Reading is better together. Join an existing group or start your own.
          </p>
          <button class="btn-empty-create" @click="navigateTo('/groups/create')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create a Group
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

// ── Types ──────────────────────────────────────────────────────
interface GroupDto {
  groupID: number
  groupName: string
  adminID: string
  adminFullName: string
  memberCount: number
}

// ── State ──────────────────────────────────────────────────────
const groups = ref<GroupDto[]>([])
const loading = ref(true)
const fetchError = ref('')

// ── Fetch user's groups on mount ──────────────────────────────
onMounted(async () => {
  auth.hydrate()

  const token = localStorage.getItem('bookclub.token')
  if (!token) return

  try {
    // GET /api/Groups returns all groups; filter to ones the current user is a member of
    // The API returns adminID and we have auth.userId to match against membership.
    // Since there's no GET /api/Groups/mine endpoint, we fetch all and filter by
    // whether the current user is the admin OR a member.
    // For now we filter by adminID — extend once a /me/groups endpoint exists.
    const all = await $fetch<GroupDto[]>('http://localhost:5000/api/Groups', {
      headers: { Authorization: `Bearer ${token}` },
    })

    // Show groups where the current user is admin or a member.
    // The API returns memberCount but not member IDs, so we filter by adminID for now.
    // TODO: replace with GET /api/Groups/mine once that endpoint is added.
    groups.value = all.filter(g => g.adminID === auth.userId)
  } catch (e) {
    fetchError.value = 'Could not load your groups. Please refresh.'
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style src="~/assets/dashboard.css" />