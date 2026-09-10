/**
 * TriggerManager
 * Evaluates triggers against legitimate Android API states:
 * Time, Date, Scheduled event, Bluetooth, Network, Charging, Battery, Notification arrival, App event, Boot.
 */

import { TriggerConfig, TriggerType, DeviceStateSnapshot } from './types';
import { deviceStateMonitor } from './DeviceStateMonitor';
import { ruleEngine } from './RuleEngine';

export type TriggerListener = (trigger: TriggerConfig, eventPayload: any) => void;

export class TriggerManager {
  private static instance: TriggerManager;

  private registeredTriggers: Map<string, TriggerConfig> = new Map();
  private triggerListeners: TriggerListener[] = [];
  private unsubscribeDeviceState: (() => void) | null = null;
  private previousSnapshot: DeviceStateSnapshot | null = null;

  private constructor() {
    this.initDeviceStateObservation();
  }

  public static getInstance(): TriggerManager {
    if (!TriggerManager.instance) {
      TriggerManager.instance = new TriggerManager();
    }
    return TriggerManager.instance;
  }

  public registerTrigger(trigger: TriggerConfig): void {
    this.registeredTriggers.set(trigger.triggerId, { ...trigger });
  }

  public unregisterTrigger(triggerId: string): boolean {
    return this.registeredTriggers.delete(triggerId);
  }

  public getTrigger(triggerId: string): TriggerConfig | undefined {
    return this.registeredTriggers.get(triggerId);
  }

  public getAllTriggers(): TriggerConfig[] {
    return Array.from(this.registeredTriggers.values());
  }

  public setTriggerEnabled(triggerId: string, enabled: boolean): void {
    const tr = this.registeredTriggers.get(triggerId);
    if (tr) {
      tr.enabled = enabled;
      this.registeredTriggers.set(triggerId, tr);
    }
  }

  public onTriggerFired(listener: TriggerListener): () => void {
    this.triggerListeners.push(listener);
    return () => {
      this.triggerListeners = this.triggerListeners.filter((l) => l !== listener);
    };
  }

  private initDeviceStateObservation(): void {
    this.unsubscribeDeviceState = deviceStateMonitor.subscribe((state) => {
      if (!this.previousSnapshot) {
        this.previousSnapshot = JSON.parse(JSON.stringify(state));
        return;
      }
      this.evaluateStateTransitions(this.previousSnapshot, state);
      this.previousSnapshot = JSON.parse(JSON.stringify(state));
    });
  }

  /**
   * Checks state transitions and fires active triggers if conditions match.
   */
  private evaluateStateTransitions(oldState: DeviceStateSnapshot, newState: DeviceStateSnapshot): void {
    for (const trigger of this.registeredTriggers.values()) {
      if (!trigger.enabled) continue;

      let shouldFire = false;
      let eventPayload: any = {};

      switch (trigger.type) {
        case TriggerType.BLUETOOTH_STATE: {
          const deviceClassTarget = trigger.parameters.deviceClass || 'car';
          const nameTarget = trigger.parameters.deviceName;

          const wasConnected = oldState.bluetooth.connectedDevices.some((d) =>
            nameTarget ? d.name.toLowerCase().includes(nameTarget.toLowerCase()) : d.deviceClass === deviceClassTarget
          );
          const isNowConnected = newState.bluetooth.connectedDevices.some((d) =>
            nameTarget ? d.name.toLowerCase().includes(nameTarget.toLowerCase()) : d.deviceClass === deviceClassTarget
          );

          if (!wasConnected && isNowConnected) {
            shouldFire = true;
            eventPayload = { connectedDevice: newState.bluetooth.connectedDevices[0] };
          }
          break;
        }

        case TriggerType.CHARGING_STATE: {
          const targetCharging = trigger.parameters.isCharging !== false;
          if (!oldState.battery.isCharging && newState.battery.isCharging && targetCharging) {
            shouldFire = true;
            eventPayload = { charging: true, source: newState.battery.chargeSource };
          } else if (oldState.battery.isCharging && !newState.battery.isCharging && !targetCharging) {
            shouldFire = true;
            eventPayload = { charging: false };
          }
          break;
        }

        case TriggerType.BATTERY_LEVEL: {
          const targetLevel = trigger.parameters.level ?? 20;
          const operator = trigger.parameters.operator || 'LESS_THAN';
          const oldPass = ruleEngine.compareValues(oldState.battery.level, operator, targetLevel);
          const newPass = ruleEngine.compareValues(newState.battery.level, operator, targetLevel);
          if (!oldPass && newPass) {
            shouldFire = true;
            eventPayload = { currentLevel: newState.battery.level };
          }
          break;
        }

        case TriggerType.NETWORK_STATE: {
          const targetType = trigger.parameters.type || 'wifi';
          const targetSsid = trigger.parameters.ssid;
          const wasConnected = oldState.network.isConnected && oldState.network.type === targetType;
          const isNowConnected = newState.network.isConnected && newState.network.type === targetType;

          if (!wasConnected && isNowConnected) {
            if (!targetSsid || (newState.network.wifiSsid && newState.network.wifiSsid.toLowerCase().includes(targetSsid.toLowerCase()))) {
              shouldFire = true;
              eventPayload = { ssid: newState.network.wifiSsid, type: newState.network.type };
            }
          }
          break;
        }

        case TriggerType.NOTIFICATION_ARRIVED: {
          if (
            newState.lastNotification &&
            newState.lastNotification.id !== oldState.lastNotification?.id
          ) {
            const notif = newState.lastNotification;
            const targetPkg = trigger.parameters.packageName;
            const keyword = trigger.parameters.keyword;

            const pkgMatch = !targetPkg || notif.packageName.includes(targetPkg);
            const keywordMatch = !keyword || (notif.title + ' ' + notif.text).toLowerCase().includes(keyword.toLowerCase());

            if (pkgMatch && keywordMatch) {
              shouldFire = true;
              eventPayload = { notification: notif };
            }
          }
          break;
        }

        case TriggerType.APP_EVENT: {
          if (
            newState.foregroundApp &&
            newState.foregroundApp.packageName !== oldState.foregroundApp?.packageName
          ) {
            const targetApp = trigger.parameters.appName || trigger.parameters.packageName;
            if (
              targetApp &&
              (newState.foregroundApp.appName.toLowerCase().includes(targetApp.toLowerCase()) ||
                newState.foregroundApp.packageName.toLowerCase().includes(targetApp.toLowerCase()))
            ) {
              shouldFire = true;
              eventPayload = { foregroundApp: newState.foregroundApp };
            }
          }
          break;
        }

        case TriggerType.TIME: {
          const targetTime = trigger.parameters.timeString; // e.g. "08:00"
          if (targetTime && newState.time.timeString === targetTime && oldState.time.timeString !== targetTime) {
            shouldFire = true;
            eventPayload = { time: newState.time.timeString };
          }
          break;
        }

        default:
          break;
      }

      if (shouldFire) {
        // Evaluate secondary conditions if attached to trigger
        if (trigger.conditions && trigger.conditions.length > 0) {
          const condRes = ruleEngine.evaluateConditions(trigger.conditions, newState);
          if (!condRes.satisfied) {
            continue;
          }
        }

        this.fireTrigger(trigger, eventPayload);
      }
    }
  }

  /**
   * Manually fires a trigger (e.g. from test mode or WorkManager alarm)
   */
  public fireTrigger(trigger: TriggerConfig, payload: any = {}): void {
    trigger.lastExecution = Date.now();
    trigger.executionResult = 'Triggered successfully';
    this.registeredTriggers.set(trigger.triggerId, trigger);

    this.triggerListeners.forEach((listener) => {
      try {
        listener(trigger, payload);
      } catch (err) {
        console.error('Trigger execution error:', err);
      }
    });
  }

  /**
   * Simulates boot recovery
   */
  public triggerBootRecovery(): { recoveredCount: number; restoredTriggers: string[] } {
    const recovered: string[] = [];
    for (const tr of this.registeredTriggers.values()) {
      if (tr.enabled) {
        recovered.push(tr.triggerId);
      }
    }
    return {
      recoveredCount: recovered.length,
      restoredTriggers: recovered,
    };
  }
}

export const triggerManager = TriggerManager.getInstance();
