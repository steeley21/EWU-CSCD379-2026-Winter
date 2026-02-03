// composables/useHivefallEngine.ts
import { computed, ref } from 'vue'
import { mergeHivefallRules, type HivefallRules } from '../game/hivefallRules'
import {
  createInitialState,
  step as stepPure,
  clearFight as clearFightPure,
  resolveFight as resolveFightPure,
  giveUp as giveUpPure,
  type MoveDir,
  type FightAction,
} from '../game/engine'

export function useHivefallEngine(overrides: Partial<HivefallRules> = {}) {
  const rules = mergeHivefallRules(overrides)
  const state = ref(createInitialState(rules))

  const grid = computed(() => state.value.grid)
  const fight = computed(() => state.value.fight)
  const status = computed(() => state.value.status)
  const playerHp = computed(() => state.value.playerHp)
  const playerMaxHp = computed(() => rules.playerMaxHp)
  const maxEnemies = computed(() => rules.maxEnemies)
  const moveCount = computed(() => state.value.moveCount)
  const infectedCount = computed(() => state.value.infectedCount)

  function reset(): void {
    state.value = createInitialState(rules)
  }

  function clearFight(): void {
    state.value = clearFightPure(state.value)
  }

  function resolveFight(action: FightAction): void {
    state.value = resolveFightPure(state.value, rules, action)
  }

  function giveUp(): void {
    state.value = giveUpPure(state.value)
  }

  function move(dir: MoveDir): void {
    state.value = stepPure(state.value, rules, dir)
  }

  return {
    rules,
    state,
    moveCount,
    infectedCount,

    grid,
    fight,
    status,
    playerHp,
    playerMaxHp,
    maxEnemies,

    reset,
    clearFight,
    resolveFight,
    giveUp,

    moveUp: () => move('up'),
    moveDown: () => move('down'),
    moveLeft: () => move('left'),
    moveRight: () => move('right'),
  }
}
