/**
 * Visibox Companion Module
 *
 * Controls Visibox live visual performance software via its local HTTP/WebSocket API.
 * Provides actions for clip/song control, boolean feedbacks for state indication,
 * variables for dynamic button text, and preset button configurations.
 */

import {
  InstanceBase,
  InstanceStatus,
  runEntrypoint,
} from '@companion-module/base'
import {
  GetConfigFields,
  type ModuleConfig,
  type ModuleSecrets,
} from './config.js'
import type { SomeCompanionConfigField } from '@companion-module/base'
import { VisiboxApiClient } from './api.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateVariableDefinitions, RefreshVariables } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'

export class ModuleInstance extends InstanceBase<ModuleConfig, ModuleSecrets> {
  apiClient!: VisiboxApiClient
  private config!: ModuleConfig
  private secrets: ModuleSecrets = {}

  constructor(internal: unknown) {
    super(internal)
  }

  async init(
    config: ModuleConfig,
    _isFirstInit: boolean,
    secrets: ModuleSecrets | undefined
  ): Promise<void> {
    this.config = config
    this.secrets = secrets ?? {}

    // Register all definitions
    UpdateActions(this)
    UpdateFeedbacks(this)
    UpdateVariableDefinitions(this)
    UpdatePresets(this)

    this.startClient()
  }

  /**
   * (Re)create the API client from the current config and stored token.
   *
   * A new client rather than updateConfig(): the SDK takes the token and
   * pairing code at construction only, and both change through this path.
   */
  private startClient(): void {
    this.apiClient?.destroy()

    this.apiClient = new VisiboxApiClient({
      config: this.config,
      token: this.secrets.authToken,
      log: (level, message) => this.log(level, message),
      updateStatus: (status, message) => this.updateStatus(status, message),
      onTokenReceived: (token) => {
        this.secrets = { authToken: token }
        // The pairing code is spent the moment a token comes back; drop it
        // so a later Save never re-sends a consumed code.
        if (this.config.pairingCode) {
          this.config = { ...this.config, pairingCode: '' }
          this.saveConfig(this.config, this.secrets)
        } else {
          this.saveConfig(undefined, this.secrets)
        }
      },
    })

    // Wire state changes to feedback/variable refresh. onStateChanged covers
    // project/playstate and live appState pushes; the initial appState fetch
    // only emits the event.
    const refresh = () => {
      this.checkFeedbacks()
      RefreshVariables(this)
    }
    this.apiClient.onStateChanged = refresh
    this.apiClient.on('app-state-changed', refresh)
    refresh()

    this.updateStatus(InstanceStatus.Connecting)
    this.apiClient.connect()
  }

  async destroy(): Promise<void> {
    this.apiClient?.destroy()
  }

  async configUpdated(
    config: ModuleConfig,
    secrets: ModuleSecrets | undefined
  ): Promise<void> {
    const prev = this.config
    const prevToken = this.secrets.authToken
    this.config = config
    this.secrets = secrets ?? {}

    // Nothing the client was built from changed — leave the connection alone.
    if (
      prev.host === config.host &&
      prev.wsPort === config.wsPort &&
      prev.httpPort === config.httpPort &&
      (prev.pairingCode ?? '') === (config.pairingCode ?? '') &&
      prevToken === this.secrets.authToken
    ) {
      return
    }

    this.startClient()
  }

  getConfigFields(): SomeCompanionConfigField[] {
    return GetConfigFields()
  }
}

runEntrypoint(ModuleInstance, UpgradeScripts)
