// app/middleware/auth.ts
import { useAuthStore } from '~/stores/authStore'

export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore()
  auth.hydrate()

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
})