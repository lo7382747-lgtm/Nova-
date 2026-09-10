/**
 * NotificationAutomationService
 * Emulates Android NotificationListenerService:
 * - Detect notification arrivals
 * - Read package name, title, text, timestamp
 * - Filter and trigger automation rules
 * - Dismiss / Open notification action
 *
 * Privacy Enforcement:
 * - All notification data stored strictly in local memory
 * - Never uploaded to external servers
 * - Explicit user permission check
 */

import { deviceStateMonitor } from './DeviceStateMonitor';
import { triggerManager } from './TriggerManager';
import { TriggerType } from './types';
import { AppControlExecutor } from './AppControlExecutor';

export interface AccessibleNotification {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  timestamp: number;
  isClearable: boolean;
}

export class NotificationAutomationService {
  private static instance: NotificationAutomationService;

  private isListenerPermissionGranted: boolean = true;
  private notifications: AccessibleNotification[] = [
    {
      id: 'notif_001',
      packageName: 'com.google.android.gm',
      appName: 'Gmail',
      title: 'Project Launch Update',
      text: 'Meeting notes and deployment timetable are attached.',
      timestamp: Date.now() - 1000 * 60 * 5,
      isClearable: true,
    },
    {
      id: 'notif_002',
      packageName: 'com.whatsapp',
      appName: 'WhatsApp',
      title: 'Alex Miller',
      text: 'Hey, are you free for a quick call?',
      timestamp: Date.now() - 1000 * 60 * 2,
      isClearable: true,
    },
  ];

  public static getInstance(): NotificationAutomationService {
    if (!NotificationAutomationService.instance) {
      NotificationAutomationService.instance = new NotificationAutomationService();
    }
    return NotificationAutomationService.instance;
  }

  public hasPermission(): boolean {
    return this.isListenerPermissionGranted;
  }

  public setPermission(granted: boolean): void {
    this.isListenerPermissionGranted = granted;
  }

  public getActiveNotifications(): AccessibleNotification[] {
    if (!this.isListenerPermissionGranted) return [];
    return [...this.notifications];
  }

  /**
   * Called when a notification is posted by an external app
   */
  public onNotificationPosted(notification: Omit<AccessibleNotification, 'id' | 'timestamp' | 'isClearable'>): AccessibleNotification {
    if (!this.isListenerPermissionGranted) {
      throw new Error('Notification listener permission not granted');
    }

    const newNotif: AccessibleNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      isClearable: true,
    };

    this.notifications.unshift(newNotif);
    // Keep max 20 notifications in local memory
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }

    // Expose to DeviceStateMonitor
    deviceStateMonitor.postNotification(newNotif);

    return newNotif;
  }

  /**
   * Dismisses a notification where Android permits (cancelNotification)
   */
  public dismissNotification(notificationId: string): boolean {
    if (!this.isListenerPermissionGranted) return false;
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== notificationId);
    return this.notifications.length < initialLen;
  }

  /**
   * Opens the source application of the notification
   */
  public async openNotificationApp(notificationId: string): Promise<boolean> {
    const notif = this.notifications.find((n) => n.id === notificationId);
    if (!notif) return false;
    const res = await AppControlExecutor.launchApp(notif.packageName);
    return res.result.success;
  }

  public clearAllNotifications(): void {
    this.notifications = [];
  }
}

export const notificationAutomationService = NotificationAutomationService.getInstance();
