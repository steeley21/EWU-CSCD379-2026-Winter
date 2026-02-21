// app/middleware/admin.ts
import { useAuthStore } from '~/stores/authStore'

export default defineNuxtRouteMiddleware(() => {
    if (import.meta.server) return

    const auth = useAuthStore()
    auth.hydrate()

    if (!auth.isAuthenticated) return navigateTo('/login')
    if (!auth.isAdmin) return navigateTo('/')
})