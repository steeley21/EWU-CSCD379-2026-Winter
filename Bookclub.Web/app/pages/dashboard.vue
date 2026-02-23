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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="stat-label">My Library</div>
        <div class="stat-value">—</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-label">My Groups</div>
        <div class="stat-value">{{ loading ? '—' : groups.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <span class="action-label">Browse Books</span>
        </button>
        <button class="action-tile" @click="navigateTo('/groups')">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span class="action-label">Find a Group</span>
        </button>
        <button class="action-tile" @click="navigateTo('/library')">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </span>
          <span class="action-label">My Library</span>
        </button>
        <button class="action-tile" @click="navigateTo('/meetings')">
          <span class="action-icon">
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

      <!-- ── Pending Invites (inline, above group cards) ── -->
      <div v-if="pendingInvites.length" class="invites-tray">
        <div class="invites-tray-label">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          {{ pendingInvites.length }} pending invite{{ pendingInvites.length !== 1 ? 's' : '' }}
        </div>

        <div class="invites-list">
          <div
            v-for="invite in pendingInvites"
            :key="invite.ugid"
            class="invite-row"
          >
            <div class="invite-row-info">
              <span class="invite-row-name">{{ invite.groupName }}</span>
              <span class="invite-row-meta">
                Admin: {{ invite.adminFullName }} &middot;
                {{ invite.memberCount }} member{{ invite.memberCount !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="invite-row-actions">
              <button
                class="btn-invite-accept"
                :disabled="respondingInvite === invite.ugid"
                @click="respondToInvite(invite.ugid, 'accept')"
              >
                ✓ Accept
              </button>
              <button
                class="btn-invite-decline"
                :disabled="respondingInvite === invite.ugid"
                @click="respondToInvite(invite.ugid, 'decline')"
              >
                ✕ Decline
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="groups-loading">
        <div class="loading-bar" /><div class="loading-bar loading-bar--short" />
      </div>

      <!-- Fetch error -->
      <div v-else-if="fetchError" class="groups-fetch-error">{{ fetchError }}</div>

      <!-- Normal content -->
      <div v-else>
        <div class="groups-grid">
          <!-- Populated state -->
          <template v-if="groups.length">
            <div
              v-for="group in groups"
              :key="group.groupId"
              class="group-card"
              @click="navigateTo(`/groups/${group.groupId}`)"
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
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'
import { groupsService } from '~/services/groupsService'
import type { GroupSummaryDto, GroupInviteDto } from '~/types/dtos'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const groups = ref<GroupSummaryDto[]>([])
const loading = ref(true)
const fetchError = ref('')
const showCreatedBanner = ref(false)

const pendingInvites = ref<GroupInviteDto[]>([])
const respondingInvite = ref<number | null>(null)

async function loadGroups() {
  fetchError.value = ''
  loading.value = true
  try {
    const all = await groupsService.getAll()
    groups.value = all
  } catch (e) {
    fetchError.value = 'Could not load your groups. Please refresh.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadInvites() {
  try {
    pendingInvites.value = await groupsService.getPendingInvites()
  } catch (e) {
    console.error('Could not load invites', e)
  }
}

async function respondToInvite(ugid: number, action: 'accept' | 'decline') {
  respondingInvite.value = ugid
  try {
    if (action === 'accept') {
      await groupsService.acceptInvite(ugid)
      await loadGroups()
    } else {
      await groupsService.declineInvite(ugid)
    }
    pendingInvites.value = pendingInvites.value.filter(i => i.ugid !== ugid)
  } catch (e) {
    console.error(`Could not ${action} invite`, e)
  } finally {
    respondingInvite.value = null
  }
}

onMounted(async () => {
  auth.hydrate()

  if (route.query.created === '1') {
    showCreatedBanner.value = true
    const q = { ...route.query } as Record<string, any>
    delete q.created
    router.replace({ path: route.path, query: q })
    window.setTimeout(() => { showCreatedBanner.value = false }, 3000)
  }

  await Promise.all([loadGroups(), loadInvites()])
})
</script>

<style src="~/assets/dashboard.css" />

<style scoped>
/* ── Invites Tray ── */
.invites-tray {
  margin-bottom: 1.25rem;
  border: 1.5px dashed var(--camel, #b5845a);
  border-radius: 16px;
  padding: 1rem 1.1rem;
  background: transparent;
}

.invites-tray-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--camel, #b5845a);
  margin-bottom: 0.75rem;
}

.invites-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.invite-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--pale-oak, #f5ede4);
  border-radius: 12px;
  padding: 0.65rem 0.9rem;
  flex-wrap: wrap;
}

.invite-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.invite-row-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--coffee-bean, #2c1810);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-row-meta {
  font-size: 0.78rem;
  color: var(--text-muted, #8a7060);
}

.invite-row-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-invite-accept,
.btn-invite-decline {
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn-invite-accept:disabled,
.btn-invite-decline:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-invite-accept {
  background: var(--camel, #b5845a);
  color: #fff;
}

.btn-invite-accept:hover:not(:disabled) { opacity: 0.82; }

.btn-invite-decline {
  background: transparent;
  color: var(--text-muted, #8a7060);
  border: 1.5px solid currentColor;
}

.btn-invite-decline:hover:not(:disabled) { opacity: 0.65; }
</style>