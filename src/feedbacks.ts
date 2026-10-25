/**
 * Feedback definitions for Visibox Companion module
 *
 * 6 boolean feedbacks that change button appearance based on Visibox state:
 * - clip_playing: A foreground clip is currently playing
 * - clip_paused: The active clip is paused
 * - specific_clip_active: A specific clip (by index) is active (playing/paused/tailing)
 * - song_active: A specific song (by index) is the active song
 * - output_muted: Output audio is muted
 * - output_fullscreen: The output window is fullscreen
 *
 * Note: Stopped clips are REMOVED from `playStates` — they don't have
 * `playState: 'stopped'`. A clip not in the array means it's stopped.
 */

import { combineRgb } from '@companion-module/base'
import { summarizePlayback } from '@visibox/api-client'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
  const summary = () => {
    const state = self.apiClient.getState()
    return summarizePlayback(state.project, state.playstate)
  }

  self.setFeedbackDefinitions({
    clip_playing: {
      type: 'boolean',
      name: 'Clip Playing',
      description: 'True when any clip is currently playing or tailing',
      defaultStyle: {
        bgcolor: combineRgb(0, 204, 0),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () => summary().isPlaying,
    },

    clip_paused: {
      type: 'boolean',
      name: 'Clip Paused',
      description: 'True when the active clip is paused',
      defaultStyle: {
        bgcolor: combineRgb(204, 204, 0),
        color: combineRgb(0, 0, 0),
      },
      options: [],
      callback: () => summary().isPaused,
    },

    specific_clip_active: {
      type: 'boolean',
      name: 'Specific Clip Active',
      description:
        'True when the clip at a specific index is active (playing, paused, or tailing)',
      defaultStyle: {
        bgcolor: combineRgb(0, 204, 0),
        color: combineRgb(255, 255, 255),
      },
      options: [
        {
          id: 'clipIndex',
          type: 'number',
          label: 'Clip Index',
          default: 0,
          min: 0,
          max: 99,
          tooltip: '0-based clip index within the active song',
        },
      ],
      // Per-clip on purpose, not summary.activeClipIndex: under polyphonic
      // playback several clips co-play and every one of their buttons
      // should light, but the summary names only one.
      callback: (feedback) => {
        const state = self.apiClient.getState()
        const clipIndex = Number(feedback.options.clipIndex ?? 0)

        if (!state.playstate?.activeSongID || !state.project) return false

        // Resolve clipID from index
        const song = state.project.songs[state.playstate.activeSongID]
        if (!song) return false

        const clipId = song.clipOrder[clipIndex]
        if (!clipId) return false

        // Check if this clip is in the active playStates
        return state.playstate.playStates.some(
          (ps) =>
            ps.type === 'clip' && ps.clipID === clipId && ps.playState !== false
        )
      },
    },

    song_active: {
      type: 'boolean',
      name: 'Song Active',
      description: 'True when the song at a specific index is the active song',
      defaultStyle: {
        bgcolor: combineRgb(0, 51, 204),
        color: combineRgb(255, 255, 255),
      },
      options: [
        {
          id: 'songIndex',
          type: 'number',
          label: 'Song Index',
          default: 0,
          min: 0,
          max: 99,
          tooltip: '0-based song index in the project',
        },
      ],
      callback: (feedback) => {
        const songIndex = Number(feedback.options.songIndex ?? 0)
        const active = summary().activeSongIndex
        return active >= 0 && active === songIndex
      },
    },

    output_muted: {
      type: 'boolean',
      name: 'Output Muted',
      description: 'True when Visibox output audio is muted',
      defaultStyle: {
        bgcolor: combineRgb(204, 0, 0),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () => self.apiClient.getAppState().audioMuted,
    },

    output_fullscreen: {
      type: 'boolean',
      name: 'Output Fullscreen',
      description: 'True when the Visibox output window is fullscreen',
      defaultStyle: {
        bgcolor: combineRgb(0, 51, 204),
        color: combineRgb(255, 255, 255),
      },
      options: [],
      callback: () => self.apiClient.getAppState().outputIsFullscreen,
    },
  })
}
