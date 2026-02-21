<template>
  <header class="navbar" :class="{ 'navbar--scrolled': scrolled }">
    <div class="navbar-inner">

      <!-- Wordmark -->
      <NuxtLink to="/" class="navbar-brand">
        <span class="navbar-brand-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </span>
        <span class="navbar-brand-text">Book Club</span>
      </NuxtLink>

      <!-- Nav links -->
      <nav class="navbar-nav" aria-label="Main navigation">
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/dashboard" class="nav-link">Dashboard</NuxtLink>
        <NuxtLink v-if="isAuthenticated && isAdmin" to="/admin" class="nav-link nav-link--admin">
          Admin
        </NuxtLink>
      </nav>

      <!-- Auth actions -->
      <div class="navbar-actions">
        <NuxtLink v-if="!isAuthenticated" to="/login" class="btn-nav-primary">
          Get started
        </NuxtLink>

        <button v-else class="btn-nav-ghost" @click="doLogout">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

const isAuthenticated = ref(false)
const isAdmin = ref(false)
const scrolled = ref(false)

let authStore: ReturnType<typeof useAuthStore> | null = null

onMounted(() => {
  if (process.client) {
    authStore = useAuthStore()
    authStore.hydrate()

    isAuthenticated.value = authStore.isAuthenticated
    isAdmin.value = authStore.isAdmin

    watch(() => authStore!.isAuthenticated, (val) => { isAuthenticated.value = val })
    watch(() => authStore!.isAdmin,         (val) => { isAdmin.value = val })

    const onScroll = () => { scrolled.value = window.scrollY > 12 }
    window.addEventListener('scroll', onScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', onScroll))
  }
})

function doLogout() {
  authStore?.logout()
  navigateTo('/')
}
</script>

<style scoped>
/* ── Shell ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: rgba(250, 247, 244, 0.82); /* --bg with alpha */
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.navbar--scrolled {
  border-bottom-color: var(--border);
  box-shadow: 0 2px 20px rgba(109, 76, 61, 0.07);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 5vw, 4rem);
  height: 64px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* ── Brand ── */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  flex-shrink: 0;
}

.navbar-brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--coffee-bean);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pale-oak);
  flex-shrink: 0;
}

.navbar-brand-icon svg {
  width: 16px;
  height: 16px;
}

.navbar-brand-text {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--coffee-bean);
  letter-spacing: -0.01em;
}

/* ── Nav links ── */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.nav-link {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-pill);
  transition: color 0.18s ease, background 0.18s ease;
  letter-spacing: 0.01em;
}

.nav-link:hover {
  color: var(--coffee-bean);
  background: rgba(220, 201, 182, 0.35); /* --pale-oak tinted */
}

.nav-link.router-link-active {
  color: var(--coffee-bean);
  font-weight: 600;
}

.nav-link--admin {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dusty-olive);
}

/* ── Auth actions ── */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
}

.btn-nav-primary {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: var(--coffee-bean);
  text-decoration: none;
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 12px rgba(109, 76, 61, 0.2);
  white-space: nowrap;
}

.btn-nav-primary:hover {
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 4px 18px rgba(163, 145, 113, 0.35);
}

.btn-nav-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--pale-oak);
  border-radius: var(--radius-pill);
  padding: 0.45rem 1rem;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  white-space: nowrap;
}

.btn-nav-ghost svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-nav-ghost:hover {
  color: var(--coffee-bean);
  border-color: var(--camel);
  background: rgba(220, 201, 182, 0.2);
}

/* ── Responsive: hide nav links on small screens ── */
@media (max-width: 600px) {
  .navbar-nav { display: none; }
  .btn-nav-ghost span { display: none; }
}
</style>