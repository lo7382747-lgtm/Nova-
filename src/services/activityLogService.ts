import { ActivityLogItem, ActivityStatus } from '../types';

const STORAGE_KEY_ACTIVITIES = 'nova_activity_logs_v1';

export class ActivityLogService {
  private static instance: ActivityLogService;

  public static getInstance(): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService();
    }
    return ActivityLogService.instance;
  }

  public getActivities(): ActivityLogItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load activity logs', e);
    }
    return [
      {
        id: 'sample-act-1',
        actionType: 'whatsapp_message',
        contactName: 'Rahul Sharma',
        contactPhone: '+91 98765 43210',
        message: 'Hey Rahul, could you please share the latest updates on the project?',
        status: 'sent',
        timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
        intentData: {
          action: 'android.intent.action.SEND',
          packageName: 'com.whatsapp',
          jid: '919876543210@s.whatsapp.net',
          url: 'https://wa.me/919876543210?text=Hey%20Rahul,%20could%20you%20please%20share%20the%20latest%20updates%20on%20the%20project?',
        },
      },
    ];
  }

  public addActivity(
    item: Omit<ActivityLogItem, 'id' | 'timestamp'>
  ): ActivityLogItem {
    const activities = this.getActivities();
    const newEntry: ActivityLogItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...activities];
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save activity log', e);
    }
    return newEntry;
  }

  public updateActivityStatus(
    id: string,
    status: ActivityStatus,
    failureReason?: string
  ): void {
    const activities = this.getActivities();
    const updated = activities.map((item) =>
      item.id === id ? { ...item, status, failureReason } : item
    );
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update activity log', e);
    }
  }

  public clearActivities(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
    } catch (e) {
      console.error('Failed to clear activities', e);
    }
  }
}
