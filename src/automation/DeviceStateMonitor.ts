/**
 * DeviceStateMonitor
 * Monitors and exposes device state available through legitimate Android APIs:
 * - Battery level & charging state
 * - Network connectivity & Wi-Fi state
 * - Bluetooth state & connected devices
 * - Media connection & playback state
 * - Time & date
 * - Notification events
 * - Foreground application
 */

import { DeviceStateSnapshot } from './types';

export type DeviceStateListener = (state: DeviceStateSnapshot) => void;

export class DeviceStateMonitor {
  private static instance: DeviceStateMonitor;

  private state: DeviceStateSnapshot = {
    battery: {
      level: 85,
      isCharging: false,
      chargeSource: 'none',
    },
    network: {
      isConnected: true,
      type: 'wifi',
      wifiSsid: 'Home_5G_Fast',
      signalStrengthPercent: 92,
    },
    bluetooth: {
      isEnabled: true,
      connectedDevices: [
        {
          id: 'dev_car_01',
          name: 'Tesla Model 3 Audio',
          address: 'FC:58:FA:82:11:09',
          deviceClass: 'car',
        },
      ],
    },
    media: {
      isPlaying: false,
      trackTitle: 'Midnight City',
      artist: 'M83',
      volumePercent: 65,
      isMuted: false,
      activeApp: 'Spotify',
    },
    time: {
      currentHour: new Date().getHours(),
      currentMinute: new Date().getMinutes(),
      dayOfWeek: new Date().getDay(),
      timeString: `${String(new Date().getHours()).padStart(2, '0')}:${String(
        new Date().getMinutes()
      ).padStart(2, '0')}`,
      dateString: new Date().toISOString().split('T')[0],
    },
    foregroundApp: {
      packageName: 'com.nova.assistant',
      appName: 'Nova Assistant',
    },
  };

  private listeners: DeviceStateListener[] = [];
  private timeInterval: any = null;

  private constructor() {
    this.startTimeTicker();
  }

  public static getInstance(): DeviceStateMonitor {
    if (!DeviceStateMonitor.instance) {
      DeviceStateMonitor.instance = new DeviceStateMonitor();
    }
    return DeviceStateMonitor.instance;
  }

  private startTimeTicker(): void {
    if (typeof window !== 'undefined') {
      this.timeInterval = setInterval(() => {
        const now = new Date();
        const newHour = now.getHours();
        const newMinute = now.getMinutes();

        if (
          this.state.time.currentMinute !== newMinute ||
          this.state.time.currentHour !== newHour
        ) {
          this.updateState({
            time: {
              currentHour: newHour,
              currentMinute: newMinute,
              dayOfWeek: now.getDay(),
              timeString: `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`,
              dateString: now.toISOString().split('T')[0],
            },
          });
        }
      }, 15000);
    }
  }

  public getSnapshot(): DeviceStateSnapshot {
    return JSON.parse(JSON.stringify(this.state));
  }

  public subscribe(listener: DeviceStateListener): () => void {
    this.listeners.push(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public updateState(partial: Partial<DeviceStateSnapshot>): void {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  private notify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((l) => l(snap));
  }

  // --- Device State Mutation Controls (supports real simulated events) ---

  public setBattery(level: number, isCharging: boolean, chargeSource: 'ac' | 'usb' | 'wireless' | 'none' = 'none'): void {
    this.updateState({
      battery: {
        level: Math.min(100, Math.max(0, level)),
        isCharging,
        chargeSource: isCharging ? chargeSource : 'none',
      },
    });
  }

  public setBluetooth(isEnabled: boolean, connectedDevices?: DeviceStateSnapshot['bluetooth']['connectedDevices']): void {
    this.updateState({
      bluetooth: {
        isEnabled,
        connectedDevices: connectedDevices ?? this.state.bluetooth.connectedDevices,
      },
    });
  }

  public connectBluetoothDevice(name: string, deviceClass: 'car' | 'audio' | 'computer' | 'phone' | 'other' = 'car'): void {
    const existing = this.state.bluetooth.connectedDevices.filter((d) => d.name !== name);
    this.updateState({
      bluetooth: {
        isEnabled: true,
        connectedDevices: [
          ...existing,
          {
            id: `dev_${Date.now()}`,
            name,
            address: '00:11:22:33:AA:BB',
            deviceClass,
          },
        ],
      },
    });
  }

  public disconnectBluetoothDevice(nameOrId: string): void {
    this.updateState({
      bluetooth: {
        ...this.state.bluetooth,
        connectedDevices: this.state.bluetooth.connectedDevices.filter(
          (d) => d.name !== nameOrId && d.id !== nameOrId
        ),
      },
    });
  }

  public setNetwork(isConnected: boolean, type: 'wifi' | 'cellular' | 'none' = 'wifi', wifiSsid: string = 'Home_5G'): void {
    this.updateState({
      network: {
        isConnected,
        type,
        wifiSsid: type === 'wifi' ? wifiSsid : undefined,
        signalStrengthPercent: isConnected ? 85 : 0,
      },
    });
  }

  public setMediaPlayback(isPlaying: boolean, trackTitle?: string, artist?: string, volumePercent?: number): void {
    this.updateState({
      media: {
        ...this.state.media,
        isPlaying,
        trackTitle: trackTitle ?? this.state.media.trackTitle,
        artist: artist ?? this.state.media.artist,
        volumePercent: volumePercent !== undefined ? volumePercent : this.state.media.volumePercent,
      },
    });
  }

  public setMediaVolume(volumePercent: number): void {
    this.updateState({
      media: {
        ...this.state.media,
        volumePercent: Math.max(0, Math.min(100, volumePercent)),
        isMuted: volumePercent === 0,
      },
    });
  }

  public setForegroundApp(appName: string, packageName: string): void {
    this.updateState({
      foregroundApp: { appName, packageName },
    });
  }

  public postNotification(notification: {
    id: string;
    packageName: string;
    appName: string;
    title: string;
    text: string;
  }): void {
    this.updateState({
      lastNotification: {
        ...notification,
        timestamp: Date.now(),
      },
    });
  }

  public setCustomTime(hour: number, minute: number): void {
    this.updateState({
      time: {
        ...this.state.time,
        currentHour: hour,
        currentMinute: minute,
        timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      },
    });
  }
}

export const deviceStateMonitor = DeviceStateMonitor.getInstance();
