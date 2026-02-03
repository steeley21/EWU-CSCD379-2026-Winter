import { describe, it, expect } from 'vitest'
import { advanceSpawnPacing, accelerateAfterSpawn } from '../game/pacing'

describe('pacing', () => {
  it('advances movesSinceLastSpawn and does not spawn early', () => {
    const p = { currentInterval: 5, movesSinceLastSpawn: 0 }
    const r1 = advanceSpawnPacing(p)
    expect(r1.shouldSpawn).toBe(false)
    expect(r1.next).toEqual({ currentInterval: 5, movesSinceLastSpawn: 1 })
  })

  it('triggers spawn when reaching interval and resets counter', () => {
    const p = { currentInterval: 3, movesSinceLastSpawn: 2 }
    const r = advanceSpawnPacing(p)
    expect(r.shouldSpawn).toBe(true)
    expect(r.next).toEqual({ currentInterval: 3, movesSinceLastSpawn: 0 })
  })

  it('accelerates after spawn down to min interval', () => {
    expect(accelerateAfterSpawn(5, 1)).toBe(4)
    expect(accelerateAfterSpawn(2, 1)).toBe(1)
    expect(accelerateAfterSpawn(1, 1)).toBe(1)
  })
})
