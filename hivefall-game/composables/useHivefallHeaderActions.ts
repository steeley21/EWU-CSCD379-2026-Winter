// composables/useHivefallHeaderActions.ts
import { ref } from 'vue'
import { giveUp } from '../game/engine'

const resetFn = ref<null | (() => void)>(null)
const giveUpFn = ref<null | (() => void)>(null)

export function useHivefallHeaderActions() {
  return { resetFn, giveUpFn }
}
