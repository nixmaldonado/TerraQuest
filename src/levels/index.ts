import type { LevelDefinition } from '../types/index'
import { level1 } from './level1'
import { level2 } from './level2'
import { level3 } from './level3'
import { level4 } from './level4'
import { level5 } from './level5'

export const levels: LevelDefinition[] = [level1, level2, level3, level4, level5]

export function getLevel(id: number): LevelDefinition | undefined {
  return levels.find((level) => level.id === id)
}
