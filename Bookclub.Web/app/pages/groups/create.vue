<template>
  <div class="create-group-page">
    <div class="form-card">

      <!-- Header -->
      <div class="form-header">
        <NuxtLink to="/dashboard" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </NuxtLink>
        <div class="form-eyebrow">Groups</div>
        <h1 class="form-title">Create a <em>new group</em></h1>
        <p class="form-sub">Start a reading community around a shared interest, genre, or series.</p>
      </div>

      <!-- Form -->
      <form class="group-form" novalidate @submit.prevent="handleSubmit">

        <!-- Group Name -->
        <div class="field-group" :class="{ 'field-group--error': errors.name }">
          <label class="field-label" for="group-name">Group name <span class="required">*</span></label>
          <input
            id="group-name"
            v-model="form.name"
            type="text"
            class="field-input"
            placeholder="e.g. Sunday Sci-Fi Readers"
            autocomplete="off"
            maxlength="80"
            @blur="validateName"
          />
          <div class="field-hint">
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            <span v-else class="field-count">{{ form.name.length }}/80</span>
          </div>
        </div>

        <!-- Location -->
        <div class="field-group" :class="{ 'field-group--error': errors.location }">
          <label class="field-label">Location <span class="required">*</span></label>

          <!-- Toggle: Online / In-person -->
          <div class="location-toggle">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: locationMode === 'online' }"
              @click="setLocationMode('online')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Online
            </button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: locationMode === 'inperson' }"
              @click="setLocationMode('inperson')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              In person
            </button>
          </div>

          <!-- City / State input (only when in-person) -->
          <transition name="slide-down">
            <div v-if="locationMode === 'inperson'" class="location-fields">
              <input
                v-model="form.city"
                type="text"
                class="field-input"
                placeholder="City"
                autocomplete="address-level2"
                @blur="validateLocation"
              />
              <input
                v-model="form.state"
                type="text"
                class="field-input field-input--short"
                placeholder="State / Province"
                autocomplete="address-level1"
                @blur="validateLocation"
              />
            </div>
          </transition>

          <span v-if="errors.location" class="field-error field-error--standalone">
            {{ errors.location }}
          </span>
        </div>

        <!-- Submit -->
        <div class="form-footer">
          <NuxtLink to="/dashboard" class="btn-cancel">Cancel</NuxtLink>
          <button type="submit" class="btn-submit" :disabled="submitting">
            <span v-if="submitting" class="spinner" aria-hidden="true" />
            <span>{{ submitting ? 'Creating…' : 'Create group' }}</span>
          </button>
        </div>

        <!-- API error -->
        <transition name="fade">
          <div v-if="apiError" class="api-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ apiError }}
          </div>
        </transition>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/authStore'

definePageMeta({ middleware: 'auth' })

/* ── Auth: hydrate inside onMounted to ensure localStorage is available ── */
const auth = useAuthStore()

onMounted(() => {
  auth.hydrate()
})

/* ── State ── */
const locationMode = ref<'online' | 'inperson'>('online')

const form = reactive({
  name:  '',
  city:  '',
  state: '',
})

const errors = reactive({
  name:     '',
  location: '',
})

const submitting = ref(false)
const apiError   = ref('')

/* ── Helpers ── */
function setLocationMode(mode: 'online' | 'inperson') {
  locationMode.value = mode
  errors.location = ''
  if (mode === 'online') {
    form.city  = ''
    form.state = ''
  }
}

function validateName() {
  errors.name = form.name.trim().length < 2
    ? 'Please enter a group name (at least 2 characters).'
    : ''
}

function validateLocation() {
  if (locationMode.value === 'inperson' && !form.city.trim()) {
    errors.location = 'Please enter a city.'
  } else {
    errors.location = ''
  }
}

function isValid() {
  validateName()
  validateLocation()
  return !errors.name && !errors.location
}

/* ── Submit ── */
async function handleSubmit() {
  if (!isValid()) return

  // Read token at submit time — guaranteed to be after onMounted hydration
  const token = localStorage.getItem('bookclub.token')

  if (!token) {
    apiError.value = 'You are not logged in. Please log in and try again.'
    return
  }

  submitting.value = true
  apiError.value   = ''

  try {
    await $fetch('http://localhost:5000/api/Groups', {
      method: 'POST',
      body: { groupName: form.name.trim() },
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    navigateTo('/dashboard')
  } catch (err: unknown) {
    const e = err as { data?: { message?: string; title?: string }; message?: string }
    apiError.value =
      e?.data?.message ??
      e?.data?.title   ??
      e?.message       ??
      'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>


<style scoped>
/* ── Page ── */
.create-group-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(2rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem);
  background: var(--bg);
  font-family: var(--font-body);
}

/* ── Card ── */
.form-card {
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  animation: fadeUp 0.55s ease both;
}

/* ── Header ── */
.form-header {
  padding: 2.25rem 2.25rem 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 1.5rem;
  transition: color var(--ease);
}

.back-link svg { width: 14px; height: 14px; }
.back-link:hover { color: var(--coffee-bean); }

.form-eyebrow {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dusty-olive);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-eyebrow::before {
  content: '';
  display: block;
  width: 18px;
  height: 1px;
  background: var(--camel);
}

.form-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-base);
  margin-bottom: 0.6rem;
}

.form-title em {
  font-style: italic;
  font-weight: 400;
  color: var(--camel);
}

.form-sub {
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--text-muted);
}

/* ── Form body ── */
.group-form {
  padding: 2rem 2.25rem 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ── Field group ── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-base);
}

.required {
  color: var(--camel);
  margin-left: 0.15rem;
}

.field-input {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--text-base);
  background: var(--bg);
  border: 1.5px solid var(--pale-oak);
  border-radius: var(--radius-md);
  padding: 0.7rem 1rem;
  outline: none;
  transition: border-color var(--ease), box-shadow var(--ease);
  width: 100%;
}

.field-input::placeholder { color: var(--text-light); }

.field-input:focus {
  border-color: var(--camel);
  box-shadow: 0 0 0 3px rgba(163, 145, 113, 0.15);
  background: var(--surface);
}

.field-group--error .field-input {
  border-color: #b94a48;
  box-shadow: 0 0 0 3px rgba(185, 74, 72, 0.1);
}

.field-hint {
  display: flex;
  justify-content: flex-end;
  min-height: 1.1em;
}

.field-count {
  font-size: 0.72rem;
  color: var(--text-light);
}

.field-error {
  font-size: 0.78rem;
  color: #b94a48;
  font-weight: 500;
}

.field-error--standalone {
  display: block;
  margin-top: 0.25rem;
}

/* ── Location toggle ── */
.location-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1.5px solid var(--pale-oak);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all var(--ease);
}

.toggle-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

.toggle-btn:hover {
  border-color: var(--camel);
  color: var(--coffee-bean);
}

.toggle-btn.active {
  background: var(--coffee-bean);
  border-color: var(--coffee-bean);
  color: var(--bg);
  box-shadow: var(--shadow-sm);
}

/* ── In-person city/state fields ── */
.location-fields {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}

.field-input--short { width: 140px; }

/* ── Footer ── */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.btn-cancel {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.6rem 1.1rem;
  border-radius: var(--radius-pill);
  transition: color var(--ease), background var(--ease);
}

.btn-cancel:hover {
  color: var(--coffee-bean);
  background: rgba(220, 201, 182, 0.3);
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  background: var(--coffee-bean);
  border: none;
  border-radius: var(--radius-pill);
  padding: 0.65rem 1.6rem;
  cursor: pointer;
  transition: background var(--ease), transform var(--ease), box-shadow var(--ease);
  box-shadow: 0 3px 14px rgba(109, 76, 61, 0.22);
}

.btn-submit:hover:not(:disabled) {
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(163, 145, 113, 0.35);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ── Spinner ── */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  flex-shrink: 0;
}

/* ── API error banner ── */
.api-error {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  font-size: 0.875rem;
  color: #b94a48;
  line-height: 1.5;
}

.api-error svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.22s ease, max-height 0.25s ease;
  max-height: 120px;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

/* ── Keyframes ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>