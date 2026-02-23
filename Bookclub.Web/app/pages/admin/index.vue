<template>
  <div>
    <h1 class="text-h5 mb-4">Admin</h1>

    <v-row>
      <!-- Manage Books -->
      <v-col cols="12" md="6">
        <v-card class="bc-card" rounded="lg">
          <v-card-title>Manage Books</v-card-title>
          <v-card-text class="bc-muted">
            Create, edit, and delete books.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/admin/books">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Create Admin User -->
      <v-col cols="12" md="6">
        <v-card class="bc-card" rounded="lg">
          <v-card-title>Create Admin Account</v-card-title>
          <v-card-text class="bc-muted">
            Create a new admin user for instructor/TA testing.
          </v-card-text>

          <v-card-text>
            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              class="mb-3"
              rounded="lg"
            >
              Created/admin-enabled: <strong>{{ success }}</strong>
            </v-alert>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-3"
              rounded="lg"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="submit">
              <v-text-field v-model="form.email" label="Email" variant="outlined" density="comfortable" />
              <v-text-field v-model="form.username" label="Username (optional)" variant="outlined" density="comfortable" />
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.fname" label="First name" variant="outlined" density="comfortable" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.lname" label="Last name" variant="outlined" density="comfortable" />
                </v-col>
              </v-row>

              <v-text-field
                v-model="form.password"
                label="Password"
                type="password"
                variant="outlined"
                density="comfortable"
              />
              <v-text-field
                v-model="confirm"
                label="Confirm password"
                type="password"
                variant="outlined"
                density="comfortable"
              />

              <v-btn
                color="primary"
                type="submit"
                :loading="saving"
                :disabled="saving"
                class="mt-2"
              >
                Create Admin
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { adminService } from '~/services/adminService'

definePageMeta({ middleware: 'admin' })

const saving = ref(false)
const success = ref('')
const error = ref('')

const form = reactive({
  email: '',
  username: '',
  fname: '',
  lname: '',
  password: '',
})

const confirm = ref('')

async function submit() {
  success.value = ''
  error.value = ''

  if (!form.email.trim()) { error.value = 'Email is required.'; return }
  if (!form.fname.trim()) { error.value = 'First name is required.'; return }
  if (!form.lname.trim()) { error.value = 'Last name is required.'; return }
  if (!form.password) { error.value = 'Password is required.'; return }
  if (form.password !== confirm.value) { error.value = 'Passwords do not match.'; return }

  const payload = {
    email: form.email.trim(),
    username: form.username.trim() || form.email.trim(),
    fname: form.fname.trim(),
    lname: form.lname.trim(),
    password: form.password,
  }

  saving.value = true
  try {
    const created = await adminService.createAdminUser(payload)
    success.value = `${created.email} (${created.username})`
    form.password = ''
    confirm.value = ''
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      (Array.isArray(e?.response?.data?.errors) ? e.response.data.errors.join(' ') : '') ||
      e?.message ||
      'Failed to create admin.'
    error.value = msg
  } finally {
    saving.value = false
  }
}
</script>