<template>
  <v-responsive :aspect-ratio="aspectRatio" :class="frameClasses">
    <v-img
      v-if="src"
      :src="src"
      :alt="altText"
      :class="imgClasses"
    >
      <template #error>
        <div class="bc-cover-placeholder">
          <v-icon :icon="icon" :size="iconSize" />
        </div>
      </template>
    </v-img>

    <div v-else class="bc-cover-placeholder">
      <v-icon :icon="icon" :size="iconSize" />
    </div>
  </v-responsive>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { coverUrl } from '~/utils/books'

const props = withDefaults(
  defineProps<{
    book?: any
    size?: 'S' | 'M' | 'L'
    aspectRatio?: number
    alt?: string
    icon?: string
    iconSize?: number
    bordered?: boolean
    background?: boolean
    rounded?: boolean
    frameClass?: string
    imgClass?: string
  }>(),
  {
    size: 'M',
    aspectRatio: 2 / 3,
    icon: 'mdi-book-open-page-variant',
    iconSize: 18,
    bordered: true,
    background: true,
    rounded: true,
    frameClass: '',
    imgClass: '',
  }
)

const src = computed(() => (props.book ? coverUrl(props.book, props.size) : null))

const altText = computed(() => {
  if (props.alt && props.alt.trim().length) return props.alt
  const title = String(props.book?.title ?? 'Book cover')
  return title
})

const frameClasses = computed(() => [
  'bc-cover-frame',
  props.frameClass,
  {
    'bc-cover--bordered': props.bordered,
    'bc-cover--bg': props.background,
    rounded: props.rounded,
  },
])

const imgClasses = computed(() => ['bc-cover-img', props.imgClass])
</script>

<style scoped>
.bc-cover-frame {
  width: 100%;
  overflow: hidden;
}

.bc-cover--bordered {
  border: 1px solid var(--border);
}

.bc-cover--bg {
  background: rgba(220, 201, 182, 0.12);
}

.bc-cover-img {
  width: 100%;
  height: 100%;
}

/* ✅ Key fix: do not crop/zoom */
.bc-cover-img :deep(.v-img__img) {
  object-fit: contain;
}

.bc-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
</style>