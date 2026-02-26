<template>
  <div class="bc-page find-group-coming">
    <div class="bc-container fg-wrapper">
      <div class="bc-card bc-static fg-card">
        <div class="fg-inner">

          <!-- Eyebrow -->
          <div class="bc-eyebrow">
            Find Group
          </div>

          <!-- Heading -->
          <h1 class="bc-display fg-title">
            Something beautiful is coming.
          </h1>

          <!-- Description -->
          <p class="bc-body bc-muted fg-description">
            Soon you'll be able to discover and join book clubs that match your
            favorite genres, reading pace, and vibe. We're carefully crafting
            a thoughtful way to connect readers — without the noise.
          </p>

          <hr class="bc-divider" />

          <!-- Actions -->
          <div class="fg-actions">
            <router-link to="/" class="bc-btn bc-btn-primary">
              Return Home
            </router-link>

            <button class="bc-btn bc-btn-ghost" disabled>
              Launching Soon
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "FindGroupComingSoon"
};
</script>

<style scoped>
.find-group-coming {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) 0;
}

.fg-wrapper {
  display: flex;
  justify-content: center;
}

.fg-card {
  max-width: 720px;
  width: 100%;
  padding: clamp(2rem, 5vw, 4rem);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.fg-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.fg-title {
  font-size: clamp(2.2rem, 5vw, 3rem);
}

.fg-description {
  font-size: 1.05rem;
  max-width: 560px;
  margin: 0 auto;
}

.fg-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-sm);
}

button[disabled] {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>