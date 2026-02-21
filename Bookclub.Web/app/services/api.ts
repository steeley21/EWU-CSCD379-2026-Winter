// app/services/api.ts
import axios, { type AxiosInstance } from 'axios'

const TOKEN_KEY = 'bookclub.token'

function safeGetToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function normalizeBaseUrl(url: string): string {
  // trim whitespace and remove trailing slashes
  return url.trim().replace(/\/+$/, '')
}

export const api: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setApiBaseUrl(baseUrl: string) {
  const normalized = normalizeBaseUrl(baseUrl)
  api.defaults.baseURL = normalized

  // Optional: uncomment while debugging
  // if (typeof window !== 'undefined') console.log('Axios baseURL set to:', api.defaults.baseURL)
}

// Attach bearer token on each request (client-safe)
api.interceptors.request.use((config) => {
  const token = safeGetToken()
  if (token) {
    config.headers = config.headers ?? {}
    // axios headers can be a plain object; this is safe in TS
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})