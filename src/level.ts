/**
 * Output level arithmetic for the `output_level` action, kept pure so the
 * clamping can be tested without Companion.
 */

export type LevelMode = 'set' | 'up' | 'down'

/**
 * Next output level (0..1) for a press.
 *
 * `percent` is the absolute target for 'set'; `stepPercent` is how far a
 * nudge moves from `current`. Either direction clamps to 0..1, so holding
 * "up" at full level is harmless and "down" never goes negative.
 */
export function nextLevel(current: number, mode: LevelMode, percent: number, stepPercent: number): number {
	const target =
		mode === 'up' ? current + stepPercent / 100 : mode === 'down' ? current - stepPercent / 100 : percent / 100
	return Math.max(0, Math.min(1, target))
}
