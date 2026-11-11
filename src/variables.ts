/**
 * Variable definitions for Visibox Companion module
 *
 * Variables that expose Visibox state for use in button text:
 * - playback_status: Current playback status (playing/paused/stopped)
 * - active_song_name: Name of the active song
 * - active_song_index: 0-based index of the active song
 * - active_clip_name: Name of the currently playing/paused clip
 * - active_clip_index: 0-based index of the currently playing/paused clip
 * - project_name: Display name of the active project
 * - output_level: Output volume, 0-100
 * - output_muted: 'true' / 'false'
 * - output_fullscreen: 'true' / 'false'
 * - song_N_name: Name of the Nth song in the project (N = 1–SLOT_COUNT)
 * - clip_N_name: Name of the Nth clip in the active song (N = 1–SLOT_COUNT)
 *
 * RefreshVariables() runs on each state change and sends only changed values.
 */

import { summarizePlayback, type Project } from '@visibox/api-client'
import type { ModuleInstance } from './main.js'

/** How many song_N_name / clip_N_name variables exist — the presets' reach. */
export const SLOT_COUNT = 10

/** The values each instance last sent, so a refresh can send only changes. */
const lastSent = new WeakMap<ModuleInstance, Record<string, string | number | boolean>>()

/**
 * Song and clip names by 1-based slot, matching the Song N / Clip N presets.
 * A slot past the end of the project or song is ''.
 */
export function slotNames(project: Project | null | undefined, activeSongID: string | null): Record<string, string> {
	const song = activeSongID ? project?.songs[activeSongID] : undefined
	const names: Record<string, string> = {}
	for (let i = 0; i < SLOT_COUNT; i++) {
		const songID = project?.songOrder[i]
		const clipID = song?.clipOrder[i]
		names[`song_${i + 1}_name`] = songID ? (project?.songs[songID]?.title ?? '') : ''
		names[`clip_${i + 1}_name`] = clipID ? (project?.clips[clipID]?.title ?? '') : ''
	}
	return names
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const slots = Array.from({ length: SLOT_COUNT }, (_, i) => i + 1)
	// New definitions start empty, so the next refresh must send everything.
	lastSent.delete(self)
	self.setVariableDefinitions([
		{ variableId: 'playback_status', name: 'Playback Status' },
		{ variableId: 'active_song_name', name: 'Active Song Name' },
		{ variableId: 'active_song_index', name: 'Active Song Index' },
		{ variableId: 'active_clip_name', name: 'Active Clip Name' },
		{ variableId: 'active_clip_index', name: 'Active Clip Index' },
		{ variableId: 'project_name', name: 'Project Name' },
		{ variableId: 'output_level', name: 'Output Level (%)' },
		{ variableId: 'output_muted', name: 'Output Muted' },
		{ variableId: 'output_fullscreen', name: 'Output Fullscreen' },
		...slots.map((n) => ({
			variableId: `song_${n}_name`,
			name: `Song ${n} Name`,
		})),
		...slots.map((n) => ({
			variableId: `clip_${n}_name`,
			name: `Clip ${n} Name (active song)`,
		})),
	])
}

/**
 * Refresh all variable values from current state.
 * Called on every state change from the API client.
 */
export function RefreshVariables(self: ModuleInstance): void {
	const state = self.apiClient.getState()
	const summary = summarizePlayback(state.project, state.playstate)
	const app = self.apiClient.getAppState()

	// Indices stay '' when unknown — buttons were written against that.
	const index = (i: number) => (i >= 0 ? String(i) : '')

	const values: Record<string, string | number | boolean> = {
		playback_status: summary.status,
		active_song_name: summary.activeSongTitle,
		active_song_index: index(summary.activeSongIndex),
		active_clip_name: summary.activeClipTitle,
		active_clip_index: index(summary.activeClipIndex),
		project_name: summary.projectTitle,
		output_level: Math.round(app.audioLevel * 100),
		output_muted: app.audioMuted,
		output_fullscreen: app.outputIsFullscreen,
		...slotNames(state.project, summary.activeSongID),
	}

	// Send only what changed: an output level change touches one variable,
	// not all 29.
	const sent = lastSent.get(self) ?? {}
	const changed = changedValues(sent, values)
	lastSent.set(self, values)
	if (Object.keys(changed).length > 0) self.setVariableValues(changed)
}

/** The entries of `next` whose value differs from `prev`. */
export function changedValues<T>(prev: Record<string, T>, next: Record<string, T>): Record<string, T> {
	const changed: Record<string, T> = {}
	for (const [id, value] of Object.entries(next)) {
		if (prev[id] !== value) changed[id] = value
	}
	return changed
}
