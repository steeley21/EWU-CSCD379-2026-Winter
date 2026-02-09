// composables/useHivefallHeaderActions.ts
import { ref } from 'vue'

const giveUpFn = ref<null | (() => void)>(null)

export function useHivefallHeaderActions() {
  return { giveUpFn }
}
