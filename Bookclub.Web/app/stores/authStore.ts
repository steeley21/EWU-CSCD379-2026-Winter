// app/stores/authStore.ts
import { defineStore } from 'pinia'
import type { AuthResponseDto, LoginRequestDto, RegisterRequestDto } from '~/types/dtos'
import { authService } from '~/services/authService'

const AUTH_KEY = 'bookclub.auth'
const TOKEN_KEY = 'bookclub.token'

function safeReadAuth(): AuthResponseDto | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthResponseDto } catch { return null }
}

function safeWriteAuth(auth: AuthResponseDto) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  localStorage.setItem(TOKEN_KEY, auth.token)
}

function safeClearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    userId: '' as string,
    email: '' as string,
    username: '' as string,
    roles: [] as string[],
    hydrated: false as boolean,
  }),

  getters: {
    isAuthenticated: (s) => !!s.token,
    isAdmin: (s) => s.roles.includes('Admin'),
  },

  actions: {
    hydrate() {
      if (this.hydrated) return
      const saved = safeReadAuth()
      if (saved) {
        this.token = saved.token
        this.userId = saved.userId
        this.email = saved.email
        this.username = saved.username
        this.roles = saved.roles ?? []
      }
      this.hydrated = true
    },

    async login(payload: LoginRequestDto) {
      const auth = await authService.login(payload)
      this.applyAuth(auth)
    },

    async register(payload: RegisterRequestDto) {
      const auth = await authService.register(payload)
      this.applyAuth(auth)
    },

    logout() {
      this.token = ''
      this.userId = ''
      this.email = ''
      this.username = ''
      this.roles = []
      safeClearAuth()
    },

      applyAuth(auth: AuthResponseDto) {
      this.token = auth.token
      this.userId = auth.userId
      this.email = auth.email
      this.username = auth.username
      this.roles = auth.roles ?? []
      safeWriteAuth(auth)
    },
  },
})