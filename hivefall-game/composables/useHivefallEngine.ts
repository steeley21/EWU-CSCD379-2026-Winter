// composables/useHivefallEngine.ts
import { computed, ref } from 'vue'
import { mergeHivefallRules, type HivefallRules } from '../game/hivefallRules'
import { clearFight as clearFightPure, createInitialState, step, type MoveDir } from '../game/engine'
import type { HivefallState } from '../game/engine'

export function useHivefallEngine(overrides: Partial<HivefallRules> = {}) {
  const rules = mergeHivefallRules(overrides)

  const state = ref<HivefallState>(createInitialState(rules))

  const grid = computed(() => state.value.grid)
  const playerPos = computed(() => state.value.playerPos)
  const enemies = computed(() => state.value.enemies)
  const moveCount = computed(() => state.value.moveCount)
  const fight = computed(() => state.value.fight)

  function reset(): void {
    state.value = createInitialState(rules)
  }

  function clearFight(): void {
    state.value = clearFightPure(state.value)
  }

  function doStep(dir: MoveDir): void {
    state.value = step(state.value, rules, dir)
  }

  return {
    rows: rules.rows,
    cols: rules.cols,
    grid,

    playerPos,
    enemies,
    moveCount,
    fight,

    reset,
    clearFight,

    moveUp: () => doStep('up'),
    moveDown: () => doStep('down'),
    moveLeft: () => doStep('left'),
    moveRight: () => doStep('right'),
  }
}
