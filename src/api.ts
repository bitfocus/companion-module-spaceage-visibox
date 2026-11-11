/**
 * Visibox API Client for Companion
 *
 * Thin wrapper around @visibox/api-client that maps ConnectionStatus
 * to Companion's InstanceStatus and keeps an authentication failure visible
 * instead of letting the SDK's follow-up 'disconnected' overwrite it.
 */

import { InstanceStatus } from '@companion-module/base'
import { VisiboxApiClient as BaseClient, type ConnectionStatus, type LogFn } from '@visibox/api-client'
import type { ModuleConfig } from './config.js'

export type { VisiboxState } from '@visibox/api-client'

/** Map SDK ConnectionStatus to Companion InstanceStatus */
const statusMap: Record<ConnectionStatus, InstanceStatus> = {
	connected: InstanceStatus.Ok,
	connecting: InstanceStatus.Connecting,
	disconnected: InstanceStatus.Disconnected,
	error: InstanceStatus.ConnectionFailure,
}

export interface VisiboxApiClientOptions {
	config: ModuleConfig
	/** Token from a previous session, if any. */
	token?: string
	log: LogFn
	updateStatus: (status: InstanceStatus, message?: string) => void
	/** Persist the token Visibox issued; the SDK presents it on every reconnect. */
	onTokenReceived: (token: string) => void
}

export class VisiboxApiClient extends BaseClient {
	constructor(options: VisiboxApiClientOptions) {
		// The SDK reports an auth failure, then 'disconnected', then schedules a
		// retry that reports 'connecting'. Hold the failure through the
		// 'disconnected' so the reason stays on screen until the next attempt.
		let authFailed = false
		super({
			host: options.config.host ?? '127.0.0.1',
			wsPort: options.config.wsPort ?? 17734,
			httpPort: options.config.httpPort ?? 17736,
			messageIdPrefix: 'cm',
			deviceName: 'Companion',
			manageState: true,
			log: options.log,
			auth: {
				initialToken: options.token,
				otp: options.config.pairingCode?.trim() || undefined,
				onTokenReceived: options.onTokenReceived,
				onAuthFailed: (error) => {
					authFailed = true
					options.updateStatus(InstanceStatus.AuthenticationFailure, error)
				},
			},
			onStatusChanged: (status) => {
				if (status === 'disconnected' && authFailed) return
				if (status === 'connecting') authFailed = false
				options.updateStatus(statusMap[status])
			},
		})
	}
}
