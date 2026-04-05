import type { LevelDefinition, DeployedResource, ScoreResult } from '../types/index'

/**
 * Calculates the player's score for a completed level attempt.
 * Takes into account correctness, time, security, efficiency, hints, and attempts.
 */
export function calculateScore(
  level: LevelDefinition,
  deployedResources: DeployedResource[],
  hintsUsed: number,
  attempts: number,
  elapsedSeconds: number,
  securityPassed: boolean
): ScoreResult {
  const { scoring } = level

  // Correctness: base points if all target resources are matched
  const allTargetsMatched = level.targetResources.every((target) =>
    deployedResources.some((deployed) => {
      if (deployed.type !== target.type) return false
      for (const [key, expectedValue] of Object.entries(target.requiredArgs)) {
        if (expectedValue === 'any') continue
        if (deployed.attributes[key] !== expectedValue) return false
      }
      return true
    })
  )
  const correctness = allTargetsMatched ? scoring.basePoints : 0

  // Time bonus: full 100 if under threshold, linear decay to 0 at 2x threshold
  let timeBonus = 0
  if (allTargetsMatched) {
    const threshold = scoring.timeBonusThreshold
    if (elapsedSeconds <= threshold) {
      timeBonus = 100
    } else if (elapsedSeconds < threshold * 2) {
      timeBonus = Math.round(100 * (1 - (elapsedSeconds - threshold) / threshold))
    }
  }

  // Security bonus
  const securityBonus = securityPassed ? scoring.securityBonusPoints : 0

  // Efficiency bonus: awarded if no unnecessary extra resources
  const targetTypeCount = level.targetResources.length
  const deployedCount = deployedResources.length
  const efficiencyBonus = deployedCount <= targetTypeCount ? scoring.efficiencyBonusPoints : 0

  // Penalties
  const hintPenalty = hintsUsed * 50
  const attemptPenalty = Math.max(0, attempts - 1) * 25

  // Total score (minimum 0)
  const rawScore = correctness + timeBonus + securityBonus + efficiencyBonus - hintPenalty - attemptPenalty
  const score = Math.max(0, rawScore)

  // Max possible score
  const maxScore = scoring.basePoints + 100 + scoring.securityBonusPoints + scoring.efficiencyBonusPoints

  // Stars
  const ratio = maxScore > 0 ? score / maxScore : 0
  let stars: 1 | 2 | 3
  if (ratio >= 0.9) {
    stars = 3
  } else if (ratio >= 0.7) {
    stars = 2
  } else {
    stars = 1
  }

  return {
    score,
    maxScore,
    stars,
    breakdown: {
      correctness,
      timeBonus,
      securityBonus,
      efficiencyBonus,
      hintPenalty,
      attemptPenalty,
    },
  }
}
