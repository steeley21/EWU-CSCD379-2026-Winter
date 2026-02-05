// composables/useHivefallEngine.ts
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { mergeHivefallRules, type HivefallRules, type WeaponId } from '../game/hivefallRules'
import {
  createInitialState,
  step as stepPure,
  endFight as endFightPure,
  resolveFight as resolveFightPure,
  engageFight as engageFightPure,
  giveUp as giveUpPure,
  tickEnemyHit as tickEnemyHitPure,
  grantWeapon as grantWeaponPure,
  type MoveDir,
  type FightAction,
} from '../game/engine'

export type WeaponButtonVm = {
  id: WeaponId
  name: string
  dmg: number
  cooldownMs: number
  cooldownRemainingMs: number
  ready: boolean
  charges: number | null
}

export type InventoryRowVm = {
  id: WeaponId
  name: string
  dmg: number
  qty: number | null
}

export function useHivefallEngine(overrides: Partial<HivefallRules> = {}) {
  const rules = mergeHivefallRules(overrides as any)
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

  const foodCount = computed(() => state.value.inventory.food ?? 0)

  const inventoryUI = computed<InventoryRowVm[]>(() => {
    const inv = state.value.inventory
    return inv.weapons.map((id) => {
      const def = rules.weapons[id]
      const qty = def.consumable ? (inv.charges[id] ?? 0) : null
      return { id, name: def.name, dmg: def.damage, qty }
    })
  })

  const weaponsUI = computed<WeaponButtonVm[]>(() => {
    const f = state.value.fight
    const inv = state.value.inventory

    return inv.weapons.map((id) => {
      const def = rules.weapons[id]
      const remaining = f?.weaponCooldownMsRemaining?.[id] ?? 0
      const charges = def.consumable ? (inv.charges[id] ?? 0) : null

      const canUse =
        state.value.status === 'playing' &&
        f?.phase === 'combat' &&
        remaining <= 0 &&
        (charges == null || charges > 0)

      return {
        id,
        name: def.name,
        dmg: def.damage,
        cooldownMs: def.cooldownMs,
        cooldownRemainingMs: remaining,
        ready: canUse,
        charges,
      }
    })
  })

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

  function grantWeapon(weaponId: WeaponId): void {
    state.value = grantWeaponPure(state.value, rules, weaponId)
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

    foodCount,
    inventoryUI,
    weaponsUI,
    grantWeapon,

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
