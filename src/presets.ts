/**
 * Preset definitions for Visibox Companion module
 *
 * ~25 pre-configured buttons organized by category:
 * - Playback: Stop, Play, Pause, Resume, Play/Stop Toggle, Pause/Resume Toggle
 * - Navigation: Next Clip, Prev Clip, Next Song, Prev Song
 * - Clips: Clip 1–10, showing the clip's name, with feedback indicators
 * - Songs: Song 1–5, showing the song's name, with active song feedback
 * - Status: Now Playing (song, clip, playback status)
 * - System: Panic, Fullscreen
 * - Audio: Volume Up, Volume Down, Mute
 */

import {
  combineRgb,
  type CompanionPresetDefinitions,
} from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdatePresets(self: ModuleInstance): void {
  const presets: CompanionPresetDefinitions = {}
  // Button text reads module variables through the connection's label.
  const v = (variableId: string) => `$(${self.label}:${variableId})`

  // ── Playback ──────────────────────────────────────────────

  const playbackPresets: Array<{
    id: string
    label: string
    controlType: string
    color: number
    bgcolor: number
  }> = [
    {
      id: 'playback_stop',
      label: 'Stop',
      controlType: 'stop',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    {
      id: 'playback_play',
      label: 'Play',
      controlType: 'play',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    {
      id: 'playback_pause',
      label: 'Pause',
      controlType: 'pause',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    {
      id: 'playback_resume',
      label: 'Resume',
      controlType: 'resume',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    {
      id: 'playback_play_toggle',
      label: 'Play/Stop',
      controlType: 'playToggle',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
    {
      id: 'playback_pause_toggle',
      label: 'Pause/Resume',
      controlType: 'pauseToggle',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
    },
  ]

  for (const p of playbackPresets) {
    presets[p.id] = {
      type: 'button',
      category: 'Playback',
      name: p.label,
      style: {
        text: p.label,
        size: 'auto',
        color: p.color,
        bgcolor: p.bgcolor,
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'playback_control',
              options: { controlType: p.controlType },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [
        {
          feedbackId: 'clip_playing',
          options: {},
          style: {
            bgcolor: combineRgb(0, 204, 0),
            color: combineRgb(255, 255, 255),
          },
        },
        {
          feedbackId: 'clip_paused',
          options: {},
          style: {
            bgcolor: combineRgb(204, 204, 0),
            color: combineRgb(0, 0, 0),
          },
        },
      ],
    }
  }

  // ── Navigation ────────────────────────────────────────────

  const navPresets: Array<{ id: string; label: string; navType: string }> = [
    { id: 'nav_next_clip', label: 'Next\\nClip', navType: 'nextClip' },
    { id: 'nav_prev_clip', label: 'Prev\\nClip', navType: 'prevClip' },
    { id: 'nav_random_clip', label: 'Random\\nClip', navType: 'randomClip' },
    { id: 'nav_next_song', label: 'Next\\nSong', navType: 'nextSong' },
    { id: 'nav_prev_song', label: 'Prev\\nSong', navType: 'prevSong' },
  ]

  for (const n of navPresets) {
    presets[n.id] = {
      type: 'button',
      category: 'Navigation',
      name: n.label.replace('\\n', ' '),
      style: {
        text: n.label,
        size: 'auto',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 0, 0),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'navigation',
              options: {
                navigationType: n.navType,
                anySong: false,
                noStop: false,
              },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  // ── Clips (1–10) ──────────────────────────────────────────

  for (let i = 0; i < 10; i++) {
    presets[`clip_${i + 1}`] = {
      type: 'button',
      category: 'Clips',
      name: `Clip ${i + 1}`,
      style: {
        text: `${i + 1}\\n${v(`clip_${i + 1}_name`)}`,
        size: 'auto',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 0, 0),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'trigger_clip',
              options: { clipIndex: i, songOffset: 0 },
            },
          ],
          up: [
            {
              actionId: 'release_clip',
              options: { clipIndex: i, songOffset: 0 },
            },
          ],
        },
      ],
      feedbacks: [
        {
          feedbackId: 'specific_clip_active',
          options: { clipIndex: i },
          style: {
            bgcolor: combineRgb(0, 204, 0),
            color: combineRgb(255, 255, 255),
          },
        },
      ],
    }
  }

  // ── Songs (1–5) ───────────────────────────────────────────

  for (let i = 0; i < 5; i++) {
    presets[`song_${i + 1}`] = {
      type: 'button',
      category: 'Songs',
      name: `Song ${i + 1}`,
      style: {
        text: `S${i + 1}\\n${v(`song_${i + 1}_name`)}`,
        size: 'auto',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 0, 0),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'song_select',
              options: { songIndex: i, songId: '', stopPlaying: true },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [
        {
          feedbackId: 'song_active',
          options: { songIndex: i },
          style: {
            bgcolor: combineRgb(0, 51, 204),
            color: combineRgb(255, 255, 255),
          },
        },
      ],
    }
  }

  // ── Status ────────────────────────────────────────────────

  presets['status_now_playing'] = {
    type: 'button',
    category: 'Status',
    name: 'Now Playing',
    style: {
      text: `${v('active_song_name')}\\n${v('active_clip_name')}\\n${v('playback_status')}`,
      size: 'auto',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
      show_topbar: false,
    },
    steps: [{ down: [], up: [] }],
    feedbacks: [
      {
        feedbackId: 'clip_playing',
        options: {},
        style: {
          bgcolor: combineRgb(0, 204, 0),
          color: combineRgb(255, 255, 255),
        },
      },
      {
        feedbackId: 'clip_paused',
        options: {},
        style: {
          bgcolor: combineRgb(204, 204, 0),
          color: combineRgb(0, 0, 0),
        },
      },
    ],
  }

  // ── System ────────────────────────────────────────────────

  presets['system_panic'] = {
    type: 'button',
    category: 'System',
    name: 'Panic',
    style: {
      text: 'PANIC',
      size: 'auto',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(204, 0, 0),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          { actionId: 'system_control', options: { controlType: 'panic' } },
        ],
        up: [],
      },
    ],
    feedbacks: [],
  }

  presets['system_fullscreen'] = {
    type: 'button',
    category: 'System',
    name: 'Fullscreen',
    style: {
      text: 'Fullscreen',
      size: 'auto',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          {
            actionId: 'system_control',
            options: { controlType: 'fullscreen' },
          },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: 'output_fullscreen',
        options: {},
        style: {
          bgcolor: combineRgb(0, 51, 204),
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  }

  // ── Audio ─────────────────────────────────────────────────

  const audioPresets: Array<{ id: string; label: string; mode: string }> = [
    { id: 'audio_volume_up', label: 'Vol\\n+', mode: 'up' },
    { id: 'audio_volume_down', label: 'Vol\\n-', mode: 'down' },
  ]

  for (const a of audioPresets) {
    presets[a.id] = {
      type: 'button',
      category: 'Audio',
      name: a.label.replace('\\n', ' '),
      style: {
        text: a.label,
        size: 'auto',
        color: combineRgb(255, 255, 255),
        bgcolor: combineRgb(0, 0, 0),
        show_topbar: false,
      },
      steps: [
        {
          down: [
            {
              actionId: 'output_level',
              options: { mode: a.mode, level: 80, step: 5 },
            },
          ],
          up: [],
        },
      ],
      feedbacks: [],
    }
  }

  presets['audio_mute'] = {
    type: 'button',
    category: 'Audio',
    name: 'Mute',
    style: {
      text: 'Mute',
      size: 'auto',
      color: combineRgb(255, 255, 255),
      bgcolor: combineRgb(0, 0, 0),
      show_topbar: false,
    },
    steps: [
      {
        down: [
          { actionId: 'system_control', options: { controlType: 'mute' } },
        ],
        up: [],
      },
    ],
    feedbacks: [
      {
        feedbackId: 'output_muted',
        options: {},
        style: {
          bgcolor: combineRgb(204, 0, 0),
          color: combineRgb(255, 255, 255),
        },
      },
    ],
  }

  self.setPresetDefinitions(presets)
}
