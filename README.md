# Visibox Companion Module

[Bitfocus Companion](https://bitfocus.io/companion) module for controlling [Visibox](https://spaceage.tv), the live visual performance software from Spaceage.

Companion is a free, open-source platform for controlling professional broadcast and live production equipment. This module allows any Companion-supported hardware (Stream Deck, X-keys, custom panels, or the web UI) to control Visibox with real-time visual feedback.

## What It Does

- **9 Actions**: Trigger clips, release held clips, select songs, playback control, navigation, output level (set or nudge), Real-Time Control (control / target param), system control (panic, fullscreen, mute)
- **6 Feedbacks**: Visual indicators for clip playing/paused, specific clip active, song active, output muted, output fullscreen
- **29 Variables**: Playback status, song name/index, clip name/index, project name, output level/muted/fullscreen, and the names of songs 1–10 and of clips 1–10 in the active song
- **25+ Presets**: Pre-configured button layouts for immediate use
- **Real-time Updates**: WebSocket connection for live state sync
- **Auto-reconnect**: Resilient connection with health checks

## Prerequisites

- **Visibox 6.0+** on a pro plan (the Remote Control API is a pro feature; there is no setting to enable it)
- **Companion** 4.2 or higher

## Install

In Companion, open **Connections**, add a connection, and search for **Visibox**. Choose **SpaceAge Visibox**, then fill in the settings below.

## How It Works

The module keeps one WebSocket connection open to Visibox. Actions go over it, and Visibox pushes every playback and output change back, so feedbacks and variables update as soon as something happens. Companion's status indicator for the connection shows green when it is connected and authenticated.

### API Connection

- **HTTP**: `http://<host>:17736` — health checks, initial state fetch
- **WebSocket**: `ws://<host>:17734` — actions, real-time state updates
- **Keepalive**: 30-second ping interval
- **Reconnect**: 5-second retry on disconnect

### Authentication

Visibox 6.0 requires every connection to be approved once, including one from the same computer. On the same computer, leave Pairing Code empty and click Allow in the dialog Visibox shows. From another computer, enter a pairing code from Visibox. Either way the module then stores the token Visibox issues, out of sight of Companion's web UI, and reconnects with it from then on. The pairing code is cleared once it has been used. An authentication failure shows as Companion's **Authentication Failure** status, with Visibox's reason.

## Configuration

| Setting        | Default     | Description                                                                                                                     |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Host           | `127.0.0.1` | IP address of the Visibox computer                                                                                              |
| WebSocket Port | `17734`     | Visibox WebSocket API port                                                                                                      |
| HTTP Port      | `17736`     | Visibox HTTP API port                                                                                                           |
| Pairing Code   | _(empty)_   | 6-digit code from Visibox — choose **Pair with Remote…** (Visibox menu on macOS, File menu on Windows); used once, then cleared |

## Actions

| Action               | Description                                                                   | Key Parameters                                                  |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Trigger Clip**     | Play clip by index                                                            | clipIndex (0-99), songOffset (-50 to +50)                       |
| **Release Clip**     | Release a held clip — put it in a button's _release_ actions for hold-to-play | clipIndex (0-99), songOffset (-50 to +50)                       |
| **Song Select**      | Switch to song                                                                | songIndex (0-99), songId (optional), stopPlaying                |
| **Playback Control** | Play/Pause/Stop/Resume/Toggle                                                 | controlType dropdown                                            |
| **Navigation**       | Next/Prev Clip/Song, Random Clip                                              | cross-song, don't-stop options                                  |
| **Output Level**     | Set global volume, or nudge it up/down                                        | mode (set / up / down), level (0-100%), step (1-100%)           |
| **Set Control**      | Drive a Real-Time Control, moving every Target bound to it                    | control (letter A-Z), mode (set / adjust), value (-100 to 100%) |
| **Set Target Param** | Write one Real-Time Control Target directly, bypassing Controls               | targetId, value (-100 to 100%)                                  |
| **System Control**   | Panic, Fullscreen, Mute                                                       | controlType dropdown                                            |

## Feedbacks

| Feedback             | Type    | Color  | Description                                |
| -------------------- | ------- | ------ | ------------------------------------------ |
| Clip Playing         | Boolean | Green  | True when any clip is playing or tailing   |
| Clip Paused          | Boolean | Yellow | True when any clip is paused               |
| Specific Clip Active | Boolean | Green  | True when clip at specific index is active |
| Song Active          | Boolean | Blue   | True when song at specific index is active |
| Output Muted         | Boolean | Red    | True when output audio is muted            |
| Output Fullscreen    | Boolean | Blue   | True when the output window is fullscreen  |

## Variables

| Variable                       | Description                                                       | Example                              |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------ |
| `playback_status`              | Current state                                                     | `"playing"`, `"paused"`, `"stopped"` |
| `active_song_name`             | Active song title                                                 | `"Opening Number"`                   |
| `active_song_index`            | Active song position (0-based)                                    | `"0"`                                |
| `active_clip_name`             | Active clip title                                                 | `"Intro Video"`                      |
| `active_clip_index`            | Active clip position (0-based)                                    | `"2"`                                |
| `project_name`                 | Active project name                                               | `"My Show"`                          |
| `output_level`                 | Output volume, 0-100                                              | `80`                                 |
| `output_muted`                 | Output audio muted                                                | `true`                               |
| `output_fullscreen`            | Output window fullscreen                                          | `false`                              |
| `song_1_name` … `song_10_name` | Name of the Nth song in the project; empty past the last song     | `"Opening Number"`                   |
| `clip_1_name` … `clip_10_name` | Name of the Nth clip in the active song; empty past the last clip | `"Intro Video"`                      |

## Presets

Pre-configured button layouts organized by category:

- **Playback** (6): Stop, Play, Pause, Resume, Play/Stop Toggle, Pause/Resume Toggle
- **Navigation** (5): Next Clip, Prev Clip, Random Clip, Next Song, Prev Song
- **Clips** (10): Buttons for Clips 1-10, labelled with the clip's name, with active clip feedback
- **Songs** (5): Buttons for Songs 1-5, labelled with the song's name, with active song feedback
- **Status** (1): Now Playing — active song, active clip, and playback status, lit while playing or paused
- **System** (2): Panic (red background), Fullscreen
- **Audio** (3): Volume Up, Volume Down, Mute

## Starter Page

`starter/visibox-starter.companionconfig` is a ready-made 8×3 Companion page built from the presets:

- **Row 1**: Play/Stop, Pause/Resume, Previous Song, Next Song, Previous Clip, Next Clip, Panic, Fullscreen
- **Row 2**: Songs 1–4, Now Playing, Mute, Volume Down, Volume Up
- **Row 3**: Clips 1–8

To use it:

1. In Companion, open **Import / Export** and import `visibox-starter.companionconfig`.
2. Choose the page to import it into.
3. Map its Visibox connection to your existing Visibox connection. If you have none, let the import create one.
4. If the import created a new connection, pair it (see _Pairing_ in `companion/HELP.md`).

## Troubleshooting

| Problem                               | Solution                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Status shows "Disconnected"           | Verify Visibox is running on a pro plan (the Remote Control API is a pro feature); check host/port config                |
| Status shows "Error"                  | Check Companion logs; verify network connectivity to Visibox                                                             |
| Status shows "Authentication Failure" | Enter a fresh pairing code from Visibox (**Pair with Remote…**), or approve the dialog on the Visibox machine, then save |
| Actions not firing                    | Ensure status is green "OK"; check WebSocket connection                                                                  |
| Feedbacks not updating                | Verify a project is loaded in Visibox; re-enable module instance                                                         |

## License

MIT
