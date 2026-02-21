// app/services/api.ts
import axios, { type AxiosInstance } from 'axios'

const TOKEN_KEY = 'bookclub.token'

function safeGetToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export const api: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

export function setApiBaseUrl(baseUrl: string) {
  api.defaults.baseURL = baseUrl
}

// Attach bearer token on each request (client-safe)
api.interceptors.request.use((config) => {
  const token = safeGetToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})