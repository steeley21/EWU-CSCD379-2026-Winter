<!-- app/pages/admin/index.vue -->
<template>
  <div>
    <h1 class="text-h5 mb-4">Admin</h1>

    <v-row>
      <!-- ── Manage Books card (unchanged) ── -->
      <v-col cols="12" md="6">
        <v-card class="bc-card" rounded="lg">
          <v-card-title>Manage Books</v-card-title>
          <v-card-text class="bc-muted">Create, edit, and delete books.</v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/admin/books">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- ── Create Admin User card (unchanged) ── -->
      <v-col cols="12" md="6">
        <v-card class="bc-card" rounded="lg">
          <v-card-title>Create Admin Account</v-card-title>
          <v-card-text class="bc-muted">
            Create a new admin user for instructor/TA testing.
          </v-card-text>
          <v-card-text>
            <v-alert v-if="createSuccess" type="success" variant="tonal" class="mb-3" rounded="lg">
              Created/admin-enabled: <strong>{{ createSuccess }}</strong>
            </v-alert>
            <v-alert v-if="createError" type="error" variant="tonal" class="mb-3" rounded="lg">
              {{ createError }}
            </v-alert>
            <v-form @submit.prevent="submitCreate">
              <v-text-field v-model="form.email"    label="Email"              variant="outlined" density="comfortable" />
              <v-text-field v-model="form.username" label="Username (optional)" variant="outlined" density="comfortable" />
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.fname" label="First name" variant="outlined" density="comfortable" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.lname" label="Last name"  variant="outlined" density="comfortable" />
                </v-col>
              </v-row>
              <v-text-field v-model="form.password" label="Password"         type="password" variant="outlined" density="comfortable" />
              <v-text-field v-model="confirm"        label="Confirm password" type="password" variant="outlined" density="comfortable" />
              <v-btn color="primary" type="submit" :loading="createSaving" :disabled="createSaving" class="mt-2">
                Create Admin
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Users Table ───────────────────────────────────────────────────── -->
    <v-card class="bc-card mt-6" rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap gap-2 pt-4 px-4">
        <span>All Users</span>
        <v-text-field
          v-model="userSearch"
          prepend-inner-icon="mdi-magnify"
          label="Search users..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 280px"
        />
      </v-card-title>

      <v-alert v-if="usersError" type="error" variant="tonal" class="mx-4 mb-2">{{ usersError }}</v-alert>

      <v-data-table
        :headers="userHeaders"
        :items="filteredUsers"
        :loading="loadingUsers"
        item-value="id"
        hover
        class="bc-table"
      >
        <!-- Roles column -->
        <template #item.roles="{ item }">
          <v-chip
            v-for="role in item.roles"
            :key="role"
            :color="role === 'Admin' ? 'error' : 'primary'"
            size="x-small"
            class="mr-1"
            label
          >
            {{ role }}
          </v-chip>
        </template>

        <!-- Actions column -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-2">
            <!-- Promote / Demote Admin -->
            <v-tooltip :text="item.roles.includes('Admin') ? 'Demote from Admin' : 'Promote to Admin'">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.roles.includes('Admin') ? 'mdi-shield-remove' : 'mdi-shield-plus'"
                  :color="item.roles.includes('Admin') ? 'warning' : 'success'"
                  size="small"
                  variant="tonal"
                  :loading="roleLoadingId === item.id"
                  @click="toggleAdmin(item)"
                />
              </template>
            </v-tooltip>

            <!-- Delete user -->
            <v-tooltip text="Delete user">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  color="error"
                  size="small"
                  variant="tonal"
                  @click="confirmDeleteUser(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="text-center bc-muted py-4">No users found.</div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Groups Table ──────────────────────────────────────────────────── -->
    <v-card class="bc-card mt-6 mb-8" rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap gap-2 pt-4 px-4">
        <span>All Groups</span>
        <v-text-field
          v-model="groupSearch"
          prepend-inner-icon="mdi-magnify"
          label="Search groups..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 280px"
        />
      </v-card-title>

      <v-alert v-if="groupsError" type="error" variant="tonal" class="mx-4 mb-2">{{ groupsError }}</v-alert>

      <v-data-table
        :headers="groupHeaders"
        :items="filteredGroups"
        :loading="loadingGroups"
        item-value="groupId"
        hover
        class="bc-table"
      >
        <!-- Member count -->
        <template #item.memberCount="{ item }">
          <v-chip size="x-small" label color="primary">{{ item.memberCount ?? '–' }}</v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center gap-2">
            <v-tooltip text="View group">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-outline"
                  color="primary"
                  size="small"
                  variant="tonal"
                  :to="`/groups/${item.groupId}`"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Delete group">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  color="error"
                  size="small"
                  variant="tonal"
                  @click="confirmDeleteGroup(item)"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="text-center bc-muted py-4">No groups found.</div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Confirm Delete User dialog ───────────────────────────────────── -->
    <v-dialog v-model="deleteUserDialog" max-width="420">
      <v-card class="bc-card" rounded="lg">
        <v-card-title style="font-family: var(--font-display); font-weight: 800; color: rgb(var(--v-theme-error))">
          Delete User?
        </v-card-title>
        <v-card-text>
          Permanently delete <strong>{{ pendingDeleteUser?.fullName || pendingDeleteUser?.username }}</strong>
          (<em>{{ pendingDeleteUser?.email }}</em>)?
          Their groups where they are admin will also be deleted. This cannot be undone.
        </v-card-text>
        <v-alert v-if="deleteUserErr" type="error" variant="tonal" class="mx-4 mb-2">{{ deleteUserErr }}</v-alert>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteUserDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleteUserSaving" @click="doDeleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Confirm Delete Group dialog ──────────────────────────────────── -->
    <v-dialog v-model="deleteGroupDialog" max-width="420">
      <v-card class="bc-card" rounded="lg">
        <v-card-title style="font-family: var(--font-display); font-weight: 800; color: rgb(var(--v-theme-error))">
          Delete Group?
        </v-card-title>
        <v-card-text>
          Permanently delete <strong>{{ pendingDeleteGroup?.groupName }}</strong>?
          All members, books, and meetings will be removed. This cannot be undone.
        </v-card-text>
        <v-alert v-if="deleteGroupErr" type="error" variant="tonal" class="mx-4 mb-2">{{ deleteGroupErr }}</v-alert>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteGroupDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleteGroupSaving" @click="doDeleteGroup">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { adminService } from '~/services/adminService'
import type { AdminUserDto, GroupSummaryDto } from '~/types/dtos'

definePageMeta({ middleware: 'admin' })

// ── Create Admin (existing logic, untouched) ────────────────────────────────

const createSaving = ref(false)
const createSuccess = ref('')
const createError = ref('')
const confirm = ref('')

const form = reactive({
  email: '', username: '', fname: '', lname: '', password: '',
})

async function submitCreate() {
  createSuccess.value = ''
  createError.value = ''

  if (!form.email.trim())    { createError.value = 'Email is required.'; return }
  if (!form.fname.trim())    { createError.value = 'First name is required.'; return }
  if (!form.lname.trim())    { createError.value = 'Last name is required.'; return }
  if (!form.password)        { createError.value = 'Password is required.'; return }
  if (form.password !== confirm.value) { createError.value = 'Passwords do not match.'; return }

  createSaving.value = true
  try {
    const created = await adminService.createAdminUser({
      email: form.email.trim(),
      username: form.username.trim() || form.email.trim(),
      fname: form.fname.trim(),
      lname: form.lname.trim(),
      password: form.password,
    })
    createSuccess.value = `${created.email} (${created.username})`
    form.password = ''
    confirm.value = ''
    // Refresh user list so the new admin appears
    await loadUsers()
  } catch (e: any) {
    createError.value =
      e?.response?.data?.message ||
      (Array.isArray(e?.response?.data?.errors) ? e.response.data.errors.join(' ') : '') ||
      e?.message || 'Failed to create admin.'
  } finally {
    createSaving.value = false
  }
}

// ── Users table ─────────────────────────────────────────────────────────────

const users = ref<AdminUserDto[]>([])
const loadingUsers = ref(true)
const usersError = ref('')
const userSearch = ref('')

const userHeaders = [
  { title: 'Name',     key: 'fullName',  sortable: true },
  { title: 'Email',    key: 'email',     sortable: true },
  { title: 'Username', key: 'username',  sortable: true },
  { title: 'Roles',    key: 'roles',     sortable: false },
  { title: '',         key: 'actions',   sortable: false, align: 'end' as const },
]

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.fullName?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q)
  )
})

async function loadUsers() {
  loadingUsers.value = true
  usersError.value = ''
  try {
    users.value = await adminService.getAllUsers()
  } catch (e: any) {
    usersError.value = e?.response?.data?.message ?? e?.message ?? 'Could not load users.'
  } finally {
    loadingUsers.value = false
  }
}

// Role toggle
const roleLoadingId = ref<string | null>(null)

async function toggleAdmin(user: AdminUserDto) {
  roleLoadingId.value = user.id
  const isAdmin = user.roles.includes('Admin')
  try {
    const updated = await adminService.setRole(user.id, 'Admin', !isAdmin)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = updated
  } catch (e: any) {
    usersError.value = e?.response?.data?.message ?? e?.message ?? 'Could not update role.'
  } finally {
    roleLoadingId.value = null
  }
}

// Delete user
const deleteUserDialog = ref(false)
const deleteUserSaving = ref(false)
const deleteUserErr = ref('')
const pendingDeleteUser = ref<AdminUserDto | null>(null)

function confirmDeleteUser(user: AdminUserDto) {
  pendingDeleteUser.value = user
  deleteUserErr.value = ''
  deleteUserDialog.value = true
}

async function doDeleteUser() {
  if (!pendingDeleteUser.value) return
  deleteUserErr.value = ''
  deleteUserSaving.value = true
  try {
    await adminService.deleteUser(pendingDeleteUser.value.id)
    users.value = users.value.filter(u => u.id !== pendingDeleteUser.value!.id)
    deleteUserDialog.value = false
  } catch (e: any) {
    deleteUserErr.value = e?.response?.data?.message ?? e?.message ?? 'Could not delete user.'
  } finally {
    deleteUserSaving.value = false
  }
}

// ── Groups table ─────────────────────────────────────────────────────────────

const groups = ref<GroupSummaryDto[]>([])
const loadingGroups = ref(true)
const groupsError = ref('')
const groupSearch = ref('')

const groupHeaders = [
  { title: 'Name',    key: 'groupName',    sortable: true },
  { title: 'Admin',   key: 'adminFullName', sortable: true },
  { title: 'Members', key: 'memberCount',  sortable: true },
  { title: '',        key: 'actions',      sortable: false, align: 'end' as const },
]

const filteredGroups = computed(() => {
  const q = groupSearch.value.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value.filter(g =>
    g.groupName?.toLowerCase().includes(q) ||
    g.adminFullName?.toLowerCase().includes(q)
  )
})

async function loadGroups() {
  loadingGroups.value = true
  groupsError.value = ''
  try {
    groups.value = await adminService.getAllGroups()
  } catch (e: any) {
    groupsError.value = e?.response?.data?.message ?? e?.message ?? 'Could not load groups.'
  } finally {
    loadingGroups.value = false
  }
}

// Delete group
const deleteGroupDialog = ref(false)
const deleteGroupSaving = ref(false)
const deleteGroupErr = ref('')
const pendingDeleteGroup = ref<GroupSummaryDto | null>(null)

function confirmDeleteGroup(group: GroupSummaryDto) {
  pendingDeleteGroup.value = group
  deleteGroupErr.value = ''
  deleteGroupDialog.value = true
}

async function doDeleteGroup() {
  if (!pendingDeleteGroup.value) return
  deleteGroupErr.value = ''
  deleteGroupSaving.value = true
  try {
    await adminService.deleteGroup(pendingDeleteGroup.value.groupId)
    groups.value = groups.value.filter(g => g.groupId !== pendingDeleteGroup.value!.groupId)
    deleteGroupDialog.value = false
  } catch (e: any) {
    deleteGroupErr.value = e?.response?.data?.message ?? e?.message ?? 'Could not delete group.'
  } finally {
    deleteGroupSaving.value = false
  }
}

// ── Load ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  loadUsers()
  loadGroups()
})
</script>