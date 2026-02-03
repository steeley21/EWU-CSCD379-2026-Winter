// composables/useHivefallHeaderActions.ts
import { ref } from 'vue'

const resetFn = ref<null | (() => void)>(null)

export function useHivefallHeaderActions() {
  return { resetFn }
}
