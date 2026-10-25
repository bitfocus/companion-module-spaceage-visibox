/**
 * Action definitions for Visibox Companion module
 *
 * 9 actions matching the Stream Deck plugin's functionality:
 * - trigger_clip: Trigger a clip by index in the current (or offset) song
 * - release_clip: Release a gate-mode clip on button-up
 * - song_select: Select a song by index or ID
 * - playback_control: Play, pause, stop, resume, and toggle controls
 * - navigation: Next/previous clip and song navigation
 * - output_level: Set or nudge the global output volume level
 * - set_control: Drive a Real-Time Control by display letter (absolute or relative)
 * - set_param: Write a Real-Time Control Target parameter directly
 * - system_control: Panic, fullscreen toggle, mute toggle
 */

import type { ModuleInstance } from './main.js'
import { nextLevel, type LevelMode } from './level.js'
import {
  VisiboxActions,
  clampControlValue,
  findControlByAddress,
  nextControlValue,
  normalizeControlAddress,
} from '@visibox/api-client'

/**
 * Pin key for a press/release pair: the button, plus everything that decides
 * which clip the press addressed.
 *
 * The clip index and song offset both belong in the key because Companion
 * allows several actions on one button — a down list holding
 * `trigger_clip(0, 0)` and `trigger_clip(0, +1)` addresses two different
 * clips, and keying on the index alone would let the second press overwrite
 * the first's pin, so one release would stop the wrong clip and leave the
 * other held.
 */
function pinKey(
  controlId: string,
  clipIndex: number,
  songOffset: number
): string {
  return `${controlId}:${clipIndex}:${songOffset}`
}

export function UpdateActions(self: ModuleInstance): void {
  /**
   * Params of the most recent trigger_clip press, keyed by {@link pinKey}.
   *
   * release_clip has to address the same song the press did — re-resolving
   * songOffset on release would read a possibly newer active song (a clip end
   * with loopType 'next' can advance it while the button is held) and release
   * a different song's clip, leaving the held gate clip playing. controlId is
   * shared between a button's down and up action lists, so it anchors the pair.
   *
   * Scoped to this instance rather than the module: two configured Visibox
   * connections would otherwise share one map, and a button carrying a
   * Trigger Clip for each would have the second press overwrite the first's
   * pin with a songID from a different project. Each release consumes its own
   * entry, so no eviction is needed beyond that.
   *
   * ponytail: no teardown drain. If the instance is disabled or Companion
   * quits while a pad is held, the up action never runs and a gate clip is
   * left playing — unlike the Stream Deck plugin, which releases in
   * onWillDisappear because a page switch mid-show is routine. Reconfiguring
   * a connection mid-hold is not. Upgrade path: hand this map to
   * ModuleInstance so destroy() can drain it before closing the socket.
   */
  const pressedParams = new Map<string, (string | number)[]>()

  /**
   * Last value this module sent for each Control, keyed by normalized address.
   *
   * Only the "adjust" mode reads it, and only because nothing reports a
   * Control's live position back over the API — see `nextControlValue`. Keyed
   * by address rather than by button so several rotaries pointed at the same
   * Control keep moving it in the same direction instead of fighting.
   *
   * ponytail: goes stale the moment a MIDI fader or another surface moves the
   * same Control, since this module never hears about that. Upgrade path is a
   * live Control value on the API state payload, which would let this follow
   * the bus instead of guessing.
   */
  const lastControlValues = new Map<string, number>()

  // Resolve the [clipIndex, songID?] params a clipIndex/songOffset option pair
  // addresses right now. Shared by trigger_clip and release_clip's fallback.
  const resolveClipParams = (
    clipIndex: number,
    songOffset: number
  ): (string | number)[] => {
    const params: (string | number)[] = [clipIndex]

    // Resolve songID from offset if needed
    if (songOffset !== 0) {
      const state = self.apiClient.getState()
      if (state.playstate?.activeSongID && state.project) {
        const songOrder = state.project.songOrder
        const activeSongIndex = songOrder.indexOf(state.playstate.activeSongID)
        const targetIndex = activeSongIndex + songOffset

        if (targetIndex >= 0 && targetIndex < songOrder.length) {
          params.push(songOrder[targetIndex])
        }
      }
    }

    return params
  }

  self.setActionDefinitions({
    trigger_clip: {
      name: 'Trigger Clip',
      description:
        'Trigger a specific clip by its index in the current or offset song',
      options: [
        {
          id: 'clipIndex',
          type: 'number',
          label: 'Clip Index',
          default: 0,
          min: 0,
          max: 99,
          tooltip: '0-based clip index within the song',
        },
        {
          id: 'songOffset',
          type: 'number',
          label: 'Song Offset',
          default: 0,
          min: -50,
          max: 50,
          tooltip:
            'Offset from the active song (0 = active, -1 = previous, +1 = next)',
        },
      ],
      callback: async (event) => {
        const clipIndex = Number(event.options.clipIndex ?? 0)
        const songOffset = Number(event.options.songOffset ?? 0)
        const params = resolveClipParams(clipIndex, songOffset)

        // Pinned for release_clip to pick up on button-up — see the
        // pressedParams comment above for why re-resolving there is wrong.
        pressedParams.set(
          pinKey(event.controlId, clipIndex, songOffset),
          params
        )

        await self.apiClient.sendAction(
          VisiboxActions.PLAY_CLIP_BY_INDEX,
          params
        )
      },
    },

    release_clip: {
      name: 'Release Clip',
      description:
        'Release a specific clip by its index, stopping it if triggered in Gate launch mode. Place in the "up" action list alongside Trigger Clip for hold-to-play.',
      options: [
        {
          id: 'clipIndex',
          type: 'number',
          label: 'Clip Index',
          default: 0,
          min: 0,
          max: 99,
          tooltip: '0-based clip index within the song',
        },
        {
          id: 'songOffset',
          type: 'number',
          label: 'Song Offset',
          default: 0,
          min: -50,
          max: 50,
          tooltip:
            'Offset from the active song (0 = active, -1 = previous, +1 = next)',
        },
      ],
      callback: async (event) => {
        // Use the pinned press params when this release is paired with a
        // trigger_clip down action on the same button.
        const clipIndex = Number(event.options.clipIndex ?? 0)
        const songOffset = Number(event.options.songOffset ?? 0)
        const key = pinKey(event.controlId, clipIndex, songOffset)
        const pinned = pressedParams.get(key)
        pressedParams.delete(key)

        // No pin — release_clip used standalone with no paired press, or
        // Companion restarted mid-hold. Falling back re-resolves the song
        // offset against the CURRENT active song, which is the very thing
        // the pin exists to avoid: if the song moved on, this releases a
        // different song's clip and leaves the held one playing. Say so,
        // because otherwise a stuck clip has no trail to follow.
        const params = pinned ?? resolveClipParams(clipIndex, songOffset)
        if (!pinned) {
          self.log(
            'warn',
            `Release Clip found no matching press; re-resolved to [${params.join(', ')}] against the current active song`
          )
        }

        if (
          !(await self.apiClient.sendAction(
            VisiboxActions.RELEASE_CLIP_BY_INDEX,
            params
          ))
        ) {
          // Louder than a failed press: the press succeeded, so a gate clip
          // is on stage right now and only Panic will clear it. The socket
          // can drop mid-hold and auto-reconnect, so "the press already
          // warned" does not cover this.
          self.log(
            'error',
            `Failed to release clip [${params.join(', ')}] — a gate clip may still be playing`
          )
        }
      },
    },

    song_select: {
      name: 'Song Select',
      description: 'Select a song by index or by ID',
      options: [
        {
          id: 'songIndex',
          type: 'number',
          label: 'Song Index',
          default: 0,
          min: 0,
          max: 99,
          tooltip: '0-based song index. Ignored if Song ID is set.',
        },
        {
          id: 'songId',
          type: 'textinput',
          label: 'Song ID',
          default: '',
          tooltip:
            'Optional: select by song ID instead of index. Leave empty to use index.',
        },
        {
          id: 'stopPlaying',
          type: 'checkbox',
          label: 'Stop Playing',
          default: true,
          tooltip: 'Stop current playback when selecting the song',
        },
      ],
      callback: async (event) => {
        const songId = String(event.options.songId ?? '')
        const songIndex = Number(event.options.songIndex ?? 0)
        const stopPlaying = Boolean(event.options.stopPlaying ?? true)

        if (songId) {
          await self.apiClient.sendAction(VisiboxActions.SONG_SELECT_BY_ID, [
            songId,
            stopPlaying,
          ])
        } else {
          await self.apiClient.sendAction(VisiboxActions.SONG_SELECT, [
            songIndex,
            stopPlaying,
          ])
        }
      },
    },

    playback_control: {
      name: 'Playback Control',
      description: 'Control playback: play, pause, stop, resume, or toggle',
      options: [
        {
          id: 'controlType',
          type: 'dropdown',
          label: 'Control',
          default: 'play',
          choices: [
            { id: 'play', label: 'Play' },
            { id: 'pause', label: 'Pause' },
            { id: 'stop', label: 'Stop' },
            { id: 'resume', label: 'Resume' },
            { id: 'playToggle', label: 'Play/Stop Toggle' },
            { id: 'pauseToggle', label: 'Pause/Resume Toggle' },
          ],
        },
      ],
      callback: async (event) => {
        const controlType = String(event.options.controlType ?? 'play')

        const actionMap: Record<string, string> = {
          play: VisiboxActions.PLAY,
          pause: VisiboxActions.PAUSE,
          stop: VisiboxActions.STOP,
          resume: VisiboxActions.RESUME,
          playToggle: VisiboxActions.PLAY_TOGGLE,
          pauseToggle: VisiboxActions.PAUSE_TOGGLE,
        }

        const action = actionMap[controlType]
        if (action) {
          await self.apiClient.sendAction(action, [])
        }
      },
    },

    navigation: {
      name: 'Navigation',
      description: 'Navigate between clips and songs',
      options: [
        {
          id: 'navigationType',
          type: 'dropdown',
          label: 'Direction',
          default: 'nextClip',
          choices: [
            { id: 'nextClip', label: 'Next Clip' },
            { id: 'prevClip', label: 'Previous Clip' },
            { id: 'randomClip', label: 'Random Clip' },
            { id: 'nextSong', label: 'Next Song' },
            { id: 'prevSong', label: 'Previous Song' },
          ],
        },
        {
          id: 'anySong',
          type: 'checkbox',
          label: 'Cross-Song Navigation',
          default: false,
          tooltip:
            'For clip navigation: wrap to next/previous song when reaching the end. For Random Clip: pick from every song, not just the active one',
        },
        {
          id: 'noStop',
          type: 'checkbox',
          label: "Don't Stop Playback",
          default: false,
          tooltip:
            'For song navigation: keep current clip playing when switching songs',
        },
      ],
      callback: async (event) => {
        const navigationType = String(
          event.options.navigationType ?? 'nextClip'
        )
        const anySong = Boolean(event.options.anySong ?? false)
        const noStop = Boolean(event.options.noStop ?? false)

        switch (navigationType) {
          case 'nextClip':
            await self.apiClient.sendAction(VisiboxActions.NEXT_CLIP, [anySong])
            break
          case 'prevClip':
            await self.apiClient.sendAction(VisiboxActions.PREV_CLIP, [anySong])
            break
          case 'randomClip':
            await self.apiClient.sendAction(VisiboxActions.RANDOM_CLIP, [
              anySong ? 'all' : 'song',
            ])
            break
          case 'nextSong':
            await self.apiClient.sendAction(VisiboxActions.NEXT_SONG, [noStop])
            break
          case 'prevSong':
            await self.apiClient.sendAction(VisiboxActions.PREV_SONG, [noStop])
            break
        }
      },
    },

    output_level: {
      name: 'Output Level',
      description:
        'Set the global output volume level, or nudge it up or down from where it is',
      options: [
        {
          id: 'mode',
          type: 'dropdown',
          label: 'Mode',
          default: 'set',
          choices: [
            { id: 'set', label: 'Set to level' },
            { id: 'up', label: 'Up by step' },
            { id: 'down', label: 'Down by step' },
          ],
        },
        {
          id: 'level',
          type: 'number',
          label: 'Level (%)',
          default: 80,
          min: 0,
          max: 100,
          tooltip: 'Output level as a percentage (0–100%)',
          isVisibleExpression: '$(options:mode) == "set"',
        },
        {
          id: 'step',
          type: 'number',
          label: 'Step (%)',
          default: 5,
          min: 1,
          max: 100,
          tooltip: 'How far each press moves the level',
          isVisibleExpression: '$(options:mode) != "set"',
        },
      ],
      callback: async (event) => {
        const level = nextLevel(
          self.apiClient.getAppState().audioLevel,
          String(event.options.mode ?? 'set') as LevelMode,
          Number(event.options.level ?? 80),
          Number(event.options.step ?? 5)
        )
        await self.apiClient.sendAction(VisiboxActions.OUTPUT_LEVEL, [level])
      },
    },

    set_control: {
      name: 'Set Control (Real-Time Control)',
      description:
        "Drive a Real-Time Control, moving every Target bound to it. Address it by display letter — the portable form, since a Control's internal id is generated per project.",
      options: [
        {
          id: 'control',
          type: 'textinput',
          label: 'Control',
          default: 'A',
          tooltip:
            'Display letter (A-Z). Every project has A-H; "Add Control" in the Control Bus appends I, J, … A ctl_… id also works.',
        },
        {
          id: 'mode',
          type: 'dropdown',
          label: 'Mode',
          default: 'set',
          choices: [
            { id: 'set', label: 'Set to value' },
            { id: 'adjust', label: 'Adjust by amount (for rotaries)' },
          ],
        },
        {
          id: 'value',
          type: 'number',
          label: 'Value / Amount (%)',
          default: 50,
          min: -100,
          max: 100,
          tooltip:
            "Set: the position to jump to. Adjust: how far to move per press — use a negative amount for the rotary's other direction.",
        },
      ],
      callback: async (event) => {
        const address = normalizeControlAddress(
          String(event.options.control ?? 'A')
        )
        const polarity = findControlByAddress(
          self.apiClient.getState().project?.realTimeControl?.controls,
          address
        )?.polarity
        const amount = Number(event.options.value ?? 0) / 100

        const next =
          String(event.options.mode ?? 'set') === 'adjust'
            ? nextControlValue(lastControlValues.get(address), amount, polarity)
            : clampControlValue(amount, polarity)

        lastControlValues.set(address, next)

        // Report a refusal instead of dropping it. Real-Time Control is a
        // separately-entitled feature, and on the HTTP path the response
        // carries the real reason ("not included in your plan"); without
        // this the button looks like it worked and nothing says otherwise.
        // Over the WebSocket the send is fire-and-forget, so a refusal
        // arrives later as a `response` event rather than here.
        const result = await self.apiClient.setControl(address, next)
        if (!result.success) {
          self.log(
            'warn',
            `Set Control ${address}: ${result.error ?? 'send failed'}`
          )
        }
      },
    },

    set_param: {
      name: 'Set Target Param (Real-Time Control)',
      description:
        'Write one Target parameter directly, bypassing Controls. Sharper than Set Control, and easier to point at a Target that no longer exists.',
      options: [
        {
          id: 'targetId',
          type: 'textinput',
          label: 'Target ID',
          default: '',
          tooltip:
            'Structured Target id, e.g. clip:abc123/opacity, clip:abc123/filter.blur, or master/volume',
        },
        {
          id: 'value',
          type: 'number',
          label: 'Value (%)',
          default: 50,
          min: -100,
          max: 100,
        },
      ],
      callback: async (event) => {
        const targetId = String(event.options.targetId ?? '').trim()
        if (!targetId) {
          self.log(
            'warn',
            'Set Target Param: no Target ID configured — nothing sent'
          )
          return
        }
        const result = await self.apiClient.setParam(
          targetId,
          Number(event.options.value ?? 0) / 100
        )
        if (!result.success) {
          self.log(
            'warn',
            `Set Target Param ${targetId}: ${result.error ?? 'send failed'}`
          )
        }
      },
    },

    system_control: {
      name: 'System Control',
      description:
        'System-level controls: Panic, Fullscreen toggle, or Mute toggle',
      options: [
        {
          id: 'controlType',
          type: 'dropdown',
          label: 'Control',
          default: 'panic',
          choices: [
            { id: 'panic', label: 'Panic (Reset All)' },
            { id: 'fullscreen', label: 'Fullscreen Toggle' },
            { id: 'mute', label: 'Mute Toggle' },
          ],
        },
      ],
      callback: async (event) => {
        const controlType = String(event.options.controlType ?? 'panic')

        const actionMap: Record<string, string> = {
          panic: VisiboxActions.PANIC,
          fullscreen: VisiboxActions.FULLSCREEN_TOGGLE,
          mute: VisiboxActions.MUTE_TOGGLE,
        }

        const action = actionMap[controlType]
        if (action) {
          await self.apiClient.sendAction(action, [])
        }
      },
    },
  })
}
