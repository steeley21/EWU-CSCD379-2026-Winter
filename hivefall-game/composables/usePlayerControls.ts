// composables/usePlayerControls.ts
import { computed, onBeforeUnmount, onMounted, ref, unref, type Ref } from 'vue'

type Controls = {
  onUp: () => void
  onDown: () => void
  onLeft: () => void
  onRight: () => void

  // optional
  enabled?: boolean | Ref<boolean>
  allowArrows?: boolean
  allowWASD?: boolean
  preventScroll?: boolean
}

function isTypingTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false

  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true

  return false
}

export function usePlayerControls(opts: Controls) {
  const internalEnabled = ref(true)

  const enabled = computed(() => {
    if (opts.enabled === undefined) return internalEnabled.value
    return !!unref(opts.enabled)
  })

  const allowArrows = opts.allowArrows ?? true
  const allowWASD = opts.allowWASD ?? true
  const preventScroll = opts.preventScroll ?? true

  const listenerOptions: AddEventListenerOptions = { passive: false }

  function onKeydown(e: KeyboardEvent): void {
    if (!enabled.value) return
    if (isTypingTarget(e)) return
    if (e.altKey || e.ctrlKey || e.metaKey) return

    let handled = false

    if (allowArrows) {
      switch (e.key) {
        case 'ArrowUp':
          opts.onUp()
          handled = true
          break
        case 'ArrowDown':
          opts.onDown()
          handled = true
          break
        case 'ArrowLeft':
          opts.onLeft()
          handled = true
          break
        case 'ArrowRight':
          opts.onRight()
          handled = true
          break
      }
    }

    if (!handled && allowWASD) {
      // e.code is more stable for WASD than e.key with different keyboard layouts
      switch (e.code) {
        case 'KeyW':
          opts.onUp()
          handled = true
          break
        case 'KeyS':
          opts.onDown()
          handled = true
          break
        case 'KeyA':
          opts.onLeft()
          handled = true
          break
        case 'KeyD':
          opts.onRight()
          handled = true
          break
      }
    }

    if (handled && preventScroll) {
      e.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown, listenerOptions)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown, listenerOptions)
  })

  function setEnabled(value: boolean): void {
    internalEnabled.value = value
  }

  return {
    enabled,
    setEnabled,
  }
}
