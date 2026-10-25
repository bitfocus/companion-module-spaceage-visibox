import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
  host: string
  wsPort: number
  httpPort: number
  /**
   * One-time pairing code shown in Visibox. Sent on the next connection
   * when no token is stored, then cleared from the saved config — the code
   * is single-use on the server, so keeping it around is only confusing.
   */
  pairingCode?: string
}

/** Stored out of the config so the web UI never sees the value. */
export interface ModuleSecrets {
  /** Device token Visibox issued after pairing or localhost approval. */
  authToken?: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
  return [
    {
      type: 'textinput',
      id: 'host',
      label: 'Visibox Host',
      width: 6,
      default: '127.0.0.1',
      tooltip:
        'IP address of the computer running Visibox. Use 127.0.0.1 if Companion runs on the same machine.',
    },
    {
      type: 'number',
      id: 'wsPort',
      label: 'WebSocket Port',
      width: 3,
      min: 1,
      max: 65535,
      default: 17734,
      tooltip: 'Visibox WebSocket API port (default: 17734)',
    },
    {
      type: 'number',
      id: 'httpPort',
      label: 'HTTP Port',
      width: 3,
      min: 1,
      max: 65535,
      default: 17736,
      tooltip: 'Visibox HTTP API port (default: 17736)',
    },
    {
      type: 'static-text',
      id: 'pairingInfo',
      label: 'Pairing',
      width: 12,
      value:
        'Every connection must be approved by Visibox, including from this machine. On the same machine, approve the dialog Visibox shows; from another machine, enter the 6-digit pairing code from Visibox (Visibox menu → Pair with Remote…). The code is used once and cleared; the device token Visibox issues is kept and reused on every restart.',
    },
    {
      type: 'textinput',
      id: 'pairingCode',
      label: 'Pairing Code',
      width: 6,
      default: '',
      tooltip:
        '6-digit code from Visibox (Visibox menu → Pair with Remote…). Used once on the next connection, then cleared.',
    },
  ]
}
