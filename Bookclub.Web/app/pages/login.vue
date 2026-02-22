<template>
  <v-row justify="center">
    <v-col cols="12" sm="10" md="6" lg="5">
      <v-card class="bc-card" rounded="lg">
        <v-card-title>Account</v-card-title>

        <v-card-text>
          <v-tabs v-model="tab" grow>
            <v-tab value="login">Login</v-tab>
            <v-tab value="register">Register</v-tab>
          </v-tabs>

          <v-window v-model="tab" class="mt-4">
            <!-- Login -->
            <v-window-item value="login">
              <v-text-field v-model="login.email" label="Email" autocomplete="email" />
              <v-text-field v-model="login.password" label="Password" type="password" autocomplete="current-password"
                @keyup.enter="submitLogin" />
              <v-btn :loading="loading" color="primary" block class="mt-2" @click="submitLogin">
                Login
              </v-btn>
            </v-window-item>

            <!-- Register -->
            <v-window-item value="register">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="reg.fname" label="First name" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="reg.lname" label="Last name" />
                </v-col>
              </v-row>
              <v-text-field v-model="reg.email" label="Email" type="email" autocomplete="email" />
              <v-text-field v-model="reg.username" label="Username" autocomplete="username" />
              <v-text-field v-model="reg.password" label="Password" type="password" autocomplete="new-password"
                @keyup.enter="submitRegister" />
              <v-btn :loading="loading" color="primary" block class="mt-2" @click="submitRegister">
                Create account
              </v-btn>
            </v-window-item>
          </v-window>

          <v-alert v-if="errMsg" type="error" variant="tonal" class="mt-4">
            {{ errMsg }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

if (import.meta.client) {
  const auth = useAuthStore()
  auth.hydrate()
  if (auth.isAuthenticated) {
    await navigateTo('/dashboard')
  }
}

const tab = ref<'login' | 'register'>('login')
const loading = ref(false)
const errMsg = ref('')

const login = ref({ email: '', password: '' })
const reg = ref({ fname: '', lname: '', email: '', username: '', password: '' })

async function submitLogin() {
  errMsg.value = ''
  loading.value = true
  try {
    const auth = useAuthStore()
    await auth.login(login.value)
    await navigateTo('/dashboard')
  } catch (e: any) {
    errMsg.value = e?.message ?? 'Login failed'
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  errMsg.value = ''
  loading.value = true
  try {
    const auth = useAuthStore()
    await auth.register(reg.value)
    await navigateTo('/dashboard')
  } catch (e: any) {
    errMsg.value = e?.message ?? 'Register failed'
  } finally {
    loading.value = false
  }
}
</script>