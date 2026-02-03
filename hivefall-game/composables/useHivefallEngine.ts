// composables/useHivefallEngine.ts
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { mergeHivefallRules, type HivefallRules } from '../game/hivefallRules'
import {
  createInitialState,
  step as stepPure,
  clearFight as clearFightPure,
  resolveFight as resolveFightPure,
  giveUp as giveUpPure,
  tickEnemyHit as tickEnemyHitPure,
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

  // -----------------------------
  // Enemy hit timer (fight loop)
  // -----------------------------
  let enemyTimer: number | null = null

  function stopEnemyTimer(): void {
    if (enemyTimer != null) {
      window.clearInterval(enemyTimer)
      enemyTimer = null
    }
  }

  function startEnemyTimer(): void {
    stopEnemyTimer()
    if (typeof window === 'undefined') return

    const ms = Math.max(50, rules.combat.enemyHitIntervalMs)

    enemyTimer = window.setInterval(() => {
      state.value = tickEnemyHitPure(state.value, rules)
    }, ms)
  }

  watch(
    () => (state.value.status === 'playing' ? state.value.fight?.enemyId ?? null : null),
    (enemyId) => {
      if (enemyId != null) startEnemyTimer()
      else stopEnemyTimer()
    },
    { immediate: true, flush: 'sync' }
  )


  onBeforeUnmount(() => {
    stopEnemyTimer()
  })

  function reset(): void {
    stopEnemyTimer()
    state.value = createInitialState(rules)
  }

  function clearFight(): void {
    stopEnemyTimer()
    state.value = clearFightPure(state.value)
  }

  function resolveFight(action: FightAction): void {
    // watch() will stop the timer automatically if fight clears
    state.value = resolveFightPure(state.value, rules, action)
  }

  function giveUp(): void {
    stopEnemyTimer()
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
