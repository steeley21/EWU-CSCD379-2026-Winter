// hivefall-game/composables/useHivefallEngine.ts
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { mergeHivefallRules, type HivefallRules } from '../game/hivefallRules'
import {
  createInitialState,
  step as stepPure,
  endFight as endFightPure,
  resolveFight as resolveFightPure,
  engageFight as engageFightPure,
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
  const fightPhase = computed(() => state.value.fight?.phase ?? null)

  const status = computed(() => state.value.status)
  const playerHp = computed(() => state.value.playerHp)
  const playerMaxHp = computed(() => rules.playerMaxHp)
  const maxEnemies = computed(() => rules.maxEnemies)
  const moveCount = computed(() => state.value.moveCount)
  const infectedCount = computed(() => state.value.infectedCount)

  // -----------------------------
  // Player attack cooldown (UI)
  // -----------------------------
  const attackCooldownMs = computed(() => rules.combat.playerHitCooldownMs)
  const attackCooldownRemainingMs = computed(() => state.value.fight?.playerHitCooldownMsRemaining ?? 0)
  const attackReady = computed(() => {
    return (
      state.value.status === 'playing' &&
      state.value.fight?.phase === 'combat' &&
      attackCooldownRemainingMs.value <= 0
    )
  })

  // -----------------------------
  // Fight tick timer (ONLY in combat)
  // -----------------------------
  let fightTimer: number | null = null
  const FIGHT_TICK_MS = 50

  function stopFightTimer(): void {
    if (fightTimer != null) {
      window.clearInterval(fightTimer)
      fightTimer = null
    }
  }

  function startFightTimer(): void {
    stopFightTimer()
    if (typeof window === 'undefined') return

    fightTimer = window.setInterval(() => {
      state.value = tickEnemyHitPure(state.value, rules, FIGHT_TICK_MS)
    }, FIGHT_TICK_MS)
  }

  watch(
    () => (state.value.status === 'playing' ? state.value.fight?.phase ?? null : null),
    (phase) => {
      if (phase === 'combat') startFightTimer()
      else stopFightTimer()
    },
    { immediate: true, flush: 'sync' }
  )

  onBeforeUnmount(() => {
    stopFightTimer()
  })

  function reset(): void {
    stopFightTimer()
    state.value = createInitialState(rules)
  }

  function clearFight(): void {
    stopFightTimer()
    state.value = endFightPure(state.value, rules)
  }

  function resolveFight(action: FightAction): void {
    state.value = resolveFightPure(state.value, rules, action)
  }

  function engageFight(): void {
    state.value = engageFightPure(state.value, rules)
  }

  function giveUp(): void {
    stopFightTimer()
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
    fightPhase,
    status,
    playerHp,
    playerMaxHp,
    maxEnemies,

    // UI helpers
    attackCooldownMs,
    attackCooldownRemainingMs,
    attackReady,

    reset,
    clearFight,
    resolveFight,
    engageFight,
    giveUp,

    moveUp: () => move('up'),
    moveDown: () => move('down'),
    moveLeft: () => move('left'),
    moveRight: () => move('right'),
  }
}
