import { describe, it, expect } from 'vitest'
import { advanceSpawnPacing, accelerateAfterSpawn } from '../game/pacing'

describe('pacing', () => {
  it('advanceSpawnPacing triggers spawn and resets counter', () => {
    const r = advanceSpawnPacing({ currentInterval: 3, movesSinceLastSpawn: 2 })
    expect(r.shouldSpawn).toBe(true)
    expect(r.next).toEqual({ currentInterval: 3, movesSinceLastSpawn: 0 })
  })

  it('accelerateAfterSpawn can slow acceleration via decreaseEverySpawns', () => {
    // every 2 spawns: no change on spawn 1
    expect(
      accelerateAfterSpawn(5, 1, { minInterval: 2, decreaseEverySpawns: 2 })
    ).toBe(5)

    // change on spawn 2
    expect(
      accelerateAfterSpawn(5, 2, { minInterval: 2, decreaseEverySpawns: 2 })
    ).toBe(4)
  })

  it('accelerateAfterSpawn respects minInterval', () => {
    expect(
      accelerateAfterSpawn(2, 4, { minInterval: 2, decreaseEverySpawns: 2 })
    ).toBe(2)
  })
})
