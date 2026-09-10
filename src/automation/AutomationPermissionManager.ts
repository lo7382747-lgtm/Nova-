export interface PermissionStatus {
  permission: string;
  name: string;
  description: string;
  granted: boolean;
  requiredFor: string[];
}

export class AutomationPermissionManager {
  private static instance: AutomationPermissionManager;

  private permissions: Map<string, PermissionStatus> = new Map([
    [
      'android.permission.BIND_ACCESSIBILITY_SERVICE',
      {
        permission: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        name: 'Accessibility Service',
        description: 'Required for UI inspection, clicking buttons, entering text, and gesture automation.',
        granted: true,
        requiredFor: ['UI_ACTION', 'GESTURE_ACTION', 'TEXT_ACTION'],
      },
    ],
    [
      'android.permission.POST_NOTIFICATIONS',
      {
        permission: 'android.permission.POST_NOTIFICATIONS',
        name: 'Notification Alerts',
        description: 'Allows Nova to notify you when automation chains complete or require attention.',
        granted: true,
        requiredFor: ['SYSTEM_ACTION', 'AUTOMATION_CHAIN'],
      },
    ],
    [
      'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
      {
        permission: 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        name: 'Notification Listener',
        description: 'Allows reading incoming WhatsApp and SMS alerts for smart automation triggering.',
        granted: true,
        requiredFor: ['CONDITION_ACTION'],
      },
    ],
    [
      'android.permission.CALL_PHONE',
      {
        permission: 'android.permission.CALL_PHONE',
        name: 'Phone Calls',
        description: 'Allows automated calling of confirmed contacts.',
        granted: true,
        requiredFor: ['APP_ACTION'],
      },
    ],
    [
      'android.permission.SEND_SMS',
      {
        permission: 'android.permission.SEND_SMS',
        name: 'SMS Messaging',
        description: 'Allows automated SMS dispatch with confirmation.',
        granted: true,
        requiredFor: ['APP_ACTION'],
      },
    ],
  ]);

  private listeners: ((perms: PermissionStatus[]) => void)[] = [];

  public static getInstance(): AutomationPermissionManager {
    if (!AutomationPermissionManager.instance) {
      AutomationPermissionManager.instance = new AutomationPermissionManager();
    }
    return AutomationPermissionManager.instance;
  }

  public getAllPermissions(): PermissionStatus[] {
    return Array.from(this.permissions.values());
  }

  public isPermissionGranted(permissionKey: string): boolean {
    const perm = this.permissions.get(permissionKey);
    return perm ? perm.granted : false;
  }

  public hasPermission(permissionKey: string): boolean {
    return this.isPermissionGranted(permissionKey);
  }

  public checkPermissionsForAction(requiredPerms: string[]): { allGranted: boolean; missing: string[] } {
    const missing: string[] = [];
    for (const req of requiredPerms) {
      const p = this.permissions.get(req);
      if (!p || !p.granted) {
        missing.push(req);
      }
    }
    return {
      allGranted: missing.length === 0,
      missing,
    };
  }

  public togglePermission(permissionKey: string): boolean {
    const perm = this.permissions.get(permissionKey);
    if (perm) {
      perm.granted = !perm.granted;
      this.notifyListeners();
      return perm.granted;
    }
    return false;
  }

  public setPermission(permissionKey: string, granted: boolean): void {
    const perm = this.permissions.get(permissionKey);
    if (perm) {
      perm.granted = granted;
      this.notifyListeners();
    }
  }

  public addListener(listener: (perms: PermissionStatus[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getAllPermissions());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const perms = this.getAllPermissions();
    this.listeners.forEach((l) => l(perms));
  }
}
