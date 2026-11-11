# SpaceAge Visibox

Control [Visibox](https://visibox.tv) live visual performance software from Bitfocus Companion.

## Prerequisites

- **Visibox 6.0 or later** running on a pro plan (the Remote Control API is a pro feature; there is no setting to enable it)
- Visibox API defaults: WebSocket on port **17734**, HTTP on port **17736**
- If running Companion on the same machine as Visibox, use the default host `127.0.0.1`

## Configuration

| Field          | Default     | Description                                                                                                                                     |
| -------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Host           | `127.0.0.1` | IP address of the computer running Visibox                                                                                                      |
| WebSocket Port | `17734`     | Visibox WebSocket API port                                                                                                                      |
| HTTP Port      | `17736`     | Visibox HTTP API port                                                                                                                           |
| Pairing Code   | _(empty)_   | 6-digit code from Visibox (**Pair with Remote…** — Visibox menu on macOS, File menu on Windows). Used once on the next connection, then cleared |

## Pairing

Every connection must be approved by Visibox, including one from the same machine.

- **Same machine**: leave Pairing Code empty and save. Visibox shows an approval dialog; click **Allow**.
- **Another machine**: in Visibox choose **Pair with Remote…** (Visibox menu on macOS, File menu on Windows) and read the 6-digit pairing code. Enter it in Pairing Code and save. The code is single-use — if it was already spent, Visibox shows a fresh one.

Either way Visibox issues a device token. The module stores it (out of sight of the config page) and presents it on every reconnect and restart, so pairing is a one-time step. The Pairing Code field clears itself once the token arrives.

If the status shows **Authentication Failure**, the stored token was revoked in Visibox or the pairing code was wrong or already used. Pair again: enter a fresh code (or, on the same machine, approve the dialog).

## Starter Page

For a ready-made page, use the presets (drag them from the Presets tab), or import `visibox-starter.companionconfig` (in the `starter` folder of the module's source repository) in **Import / Export**. It lays out playback, song and clip navigation, Panic, Fullscreen, Songs 1–4 and Clips 1–8 labelled with their names, a Now Playing status button, and Mute and volume. Map its connection to your Visibox connection when you import it.

## Actions

### Trigger Clip

Trigger a specific clip by its index within a song. Use **Song Offset** to target clips in adjacent songs (0 = active song, -1 = previous, +1 = next).

### Release Clip

Release a held clip — stops it if it was triggered in Gate launch mode, ignored otherwise. Put it in a button's **release** (up) actions alongside Trigger Clip for hold-to-play.

### Song Select

Select a song by its index (0-based) or by its internal ID. Optionally stop current playback when switching.

### Playback Control

Control playback with the following modes:

- **Play** — Start playback
- **Pause** — Pause current playback
- **Stop** — Stop all playback
- **Resume** — Resume paused playback
- **Play/Stop Toggle** — Toggle between playing and stopped
- **Pause/Resume Toggle** — Toggle between paused and resumed

### Navigation

Navigate between clips and songs:

- **Next/Previous Clip** — Move to the next or previous clip. Enable _Cross-Song Navigation_ to wrap across song boundaries.
- **Random Clip** — Play a random clip from the active song, never the one playing when another is available. Enable _Cross-Song Navigation_ to pick from every song.
- **Next/Previous Song** — Move to the next or previous song. Enable _Don't Stop Playback_ to keep the current clip playing.

### Output Level

- **Set to level** — Set the global output volume to a percentage (0–100%).
- **Up by step** / **Down by step** — Nudge the volume from where it is now by a step percentage, clamped to 0–100%.

### Set Control (Real-Time Control)

Drive a Real-Time Control by its display letter (A–Z), moving every Target bound to it. **Set** jumps to a value; **Adjust** moves by an amount per press, for rotaries.

### Set Target Param (Real-Time Control)

Write one Real-Time Control Target parameter directly by its structured id (for example `clip:abc123/opacity` or `master/volume`), bypassing Controls.

### System Control

- **Panic** — Reset all windows (emergency stop)
- **Fullscreen Toggle** — Toggle the output window fullscreen state
- **Mute Toggle** — Mute or unmute output audio

## Feedbacks

| Feedback             | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| Clip Playing         | True when any clip is currently playing or tailing                           |
| Clip Paused          | True when the active clip is paused                                          |
| Specific Clip Active | True when a clip at a specific index is active (playing, paused, or tailing) |
| Song Active          | True when a song at a specific index is the active song                      |
| Output Muted         | True when output audio is muted                                              |
| Output Fullscreen    | True when the output window is fullscreen                                    |

## Variables

Variables are named by the connection's label. The examples below assume the label `Visibox`; substitute your own.

| Variable                                  | Description                                          |
| ----------------------------------------- | ---------------------------------------------------- |
| `$(Visibox:playback_status)`              | Current status: `playing`, `paused`, or `stopped`    |
| `$(Visibox:active_song_name)`             | Name of the active song                              |
| `$(Visibox:active_song_index)`            | 0-based index of the active song                     |
| `$(Visibox:active_clip_name)`             | Name of the currently active clip                    |
| `$(Visibox:active_clip_index)`            | 0-based index of the currently active clip           |
| `$(Visibox:project_name)`                 | Name of the active project                           |
| `$(Visibox:output_level)`                 | Output volume, 0–100                                 |
| `$(Visibox:output_muted)`                 | `true` when output audio is muted                    |
| `$(Visibox:output_fullscreen)`            | `true` when the output window is fullscreen          |
| `$(Visibox:song_1_name)` … `song_10_name` | Name of song 1–10 in the project (empty if none)     |
| `$(Visibox:clip_1_name)` … `clip_10_name` | Name of clip 1–10 in the active song (empty if none) |

## Troubleshooting

**Status shows "Disconnected"**

- Verify Visibox is running on a pro plan (the Remote Control API is a pro feature)
- Check that the host and port settings match your Visibox configuration
- If Companion and Visibox are on different machines, ensure the firewall allows connections on the configured ports

**Status shows "Authentication Failure"**

- See _Pairing_ above — enter a fresh pairing code, or approve the dialog on the Visibox machine
- "Authentication timed out" means the approval dialog was not answered in time; save the config again to retry

**Actions not working**

- Check that the module status shows "Ok" (green)
- Verify an active project is open in Visibox with at least one song

**Feedbacks not updating**

- Feedbacks rely on the WebSocket connection for real-time updates
- If the status is "Ok" but feedbacks seem stale, try disabling and re-enabling the module instance
