import { AccessibilityNodeInfo } from './types';
import { automationService } from '../services/automationService';

export class AutomationAccessibilityService {
  private static instance: AutomationAccessibilityService;
  private isConnected = true;
  private currentTree: AccessibilityNodeInfo | null = null;
  private treeListeners: ((tree: AccessibilityNodeInfo) => void)[] = [];

  public static getInstance(): AutomationAccessibilityService {
    if (!AutomationAccessibilityService.instance) {
      AutomationAccessibilityService.instance = new AutomationAccessibilityService();
    }
    return AutomationAccessibilityService.instance;
  }

  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Returns the root AccessibilityNodeInfo of the active window.
   */
  public getRootInActiveWindow(): AccessibilityNodeInfo {
    const fg = automationService.getForegroundApp();
    const tree = this.buildHierarchyForApp(fg);
    this.currentTree = tree;
    return tree;
  }

  /**
   * Dispatches a global action (e.g. Back, Home, Recents, Notifications).
   */
  public performGlobalAction(actionId: number): boolean {
    switch (actionId) {
      case 1: // GLOBAL_ACTION_BACK
        automationService.goBack();
        return true;
      case 2: // GLOBAL_ACTION_HOME
        automationService.goHome();
        return true;
      case 3: // GLOBAL_ACTION_RECENTS
        automationService.openRecentApps();
        return true;
      case 4: // GLOBAL_ACTION_NOTIFICATIONS
        automationService.openNotifications();
        return true;
      case 5: // GLOBAL_ACTION_QUICK_SETTINGS
        automationService.openQuickSettings();
        return true;
      case 6: // GLOBAL_ACTION_TAKE_SCREENSHOT
        automationService.takeScreenshot();
        return true;
      default:
        return false;
    }
  }

  /**
   * Generates a realistic Android AccessibilityNodeInfo hierarchy based on current foreground app.
   */
  public buildHierarchyForApp(appName: string): AccessibilityNodeInfo {
    const pkg = `com.android.${appName.toLowerCase()}`;

    if (appName === 'whatsapp') {
      return {
        id: 'node-root-wa',
        packageName: 'com.whatsapp',
        className: 'android.widget.FrameLayout',
        clickable: false,
        editable: false,
        enabled: true,
        bounds: { x: 0, y: 0, width: 360, height: 740 },
        children: [
          {
            id: 'wa-action-bar',
            resourceId: 'com.whatsapp:id/action_bar',
            className: 'android.widget.Toolbar',
            text: 'WhatsApp',
            clickable: false,
            editable: false,
            enabled: true,
            bounds: { x: 0, y: 0, width: 360, height: 56 },
            children: [
              {
                id: 'wa-search-btn',
                resourceId: 'com.whatsapp:id/menuitem_search',
                contentDescription: 'Search',
                className: 'android.widget.ImageView',
                clickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 280, y: 12, width: 32, height: 32 },
              },
            ],
          },
          {
            id: 'wa-search-input',
            resourceId: 'com.whatsapp:id/search_src_text',
            contentDescription: 'Search contacts and chats',
            text: '',
            className: 'android.widget.EditText',
            clickable: true,
            editable: true,
            enabled: true,
            bounds: { x: 48, y: 10, width: 230, height: 40 },
          },
          {
            id: 'wa-chat-list',
            resourceId: 'com.whatsapp:id/conversations_list',
            className: 'androidx.recyclerview.widget.RecyclerView',
            scrollable: true,
            clickable: false,
            editable: false,
            enabled: true,
            bounds: { x: 0, y: 56, width: 360, height: 684 },
            children: [
              {
                id: 'wa-item-rahul',
                resourceId: 'com.whatsapp:id/contact_row_rahul',
                text: 'Rahul Sharma',
                contentDescription: 'Rahul Sharma, Unread messages: 2',
                className: 'android.widget.RelativeLayout',
                clickable: true,
                longClickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 16, y: 64, width: 328, height: 72 },
              },
              {
                id: 'wa-item-priya',
                resourceId: 'com.whatsapp:id/contact_row_priya',
                text: 'Priya Patel',
                contentDescription: 'Priya Patel, Hey there!',
                className: 'android.widget.RelativeLayout',
                clickable: true,
                longClickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 16, y: 140, width: 328, height: 72 },
              },
              {
                id: 'wa-item-family',
                resourceId: 'com.whatsapp:id/contact_row_family',
                text: 'Family Group',
                contentDescription: 'Family Group, Good morning!',
                className: 'android.widget.RelativeLayout',
                clickable: true,
                longClickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 16, y: 216, width: 328, height: 72 },
              },
            ],
          },
        ],
      };
    }

    if (appName === 'youtube') {
      return {
        id: 'node-root-yt',
        packageName: 'com.google.android.youtube',
        className: 'android.widget.FrameLayout',
        clickable: false,
        editable: false,
        enabled: true,
        bounds: { x: 0, y: 0, width: 360, height: 740 },
        children: [
          {
            id: 'yt-header',
            resourceId: 'com.google.android.youtube:id/header_bar',
            className: 'android.view.ViewGroup',
            clickable: false,
            editable: false,
            enabled: true,
            bounds: { x: 0, y: 0, width: 360, height: 52 },
            children: [
              {
                id: 'yt-search-btn',
                resourceId: 'com.google.android.youtube:id/search_button',
                contentDescription: 'Search YouTube',
                className: 'android.widget.ImageView',
                clickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 270, y: 10, width: 36, height: 36 },
              },
            ],
          },
          {
            id: 'yt-search-input',
            resourceId: 'com.google.android.youtube:id/search_edit_text',
            text: '',
            contentDescription: 'Search',
            className: 'android.widget.EditText',
            clickable: true,
            editable: true,
            enabled: true,
            bounds: { x: 44, y: 8, width: 220, height: 38 },
          },
          {
            id: 'yt-video-feed',
            resourceId: 'com.google.android.youtube:id/feed_recycler',
            className: 'androidx.recyclerview.widget.RecyclerView',
            scrollable: true,
            clickable: false,
            editable: false,
            enabled: true,
            bounds: { x: 0, y: 52, width: 360, height: 688 },
            children: [
              {
                id: 'yt-video-1',
                resourceId: 'com.google.android.youtube:id/video_item_relaxing',
                text: '3 Hours Relaxing Ambient Music for Focus & Sleep',
                contentDescription: '3 Hours Relaxing Ambient Music for Focus & Sleep, 4.2M views',
                className: 'android.view.ViewGroup',
                clickable: true,
                longClickable: true,
                editable: false,
                enabled: true,
                bounds: { x: 0, y: 56, width: 360, height: 210 },
              },
            ],
          },
        ],
      };
    }

    if (appName === 'instagram') {
      return {
        id: 'node-root-ig',
        packageName: 'com.instagram.android',
        className: 'android.widget.FrameLayout',
        clickable: false,
        editable: false,
        enabled: true,
        bounds: { x: 0, y: 0, width: 360, height: 740 },
        children: [
          {
            id: 'ig-feed',
            resourceId: 'com.instagram.android:id/feed_stream',
            className: 'androidx.recyclerview.widget.RecyclerView',
            scrollable: true,
            clickable: false,
            editable: false,
            enabled: true,
            bounds: { x: 0, y: 48, width: 360, height: 692 },
            children: [
              {
                id: 'ig-post-1',
                resourceId: 'com.instagram.android:id/row_feed_post',
                className: 'android.widget.LinearLayout',
                clickable: false,
                editable: false,
                enabled: true,
                bounds: { x: 0, y: 50, width: 360, height: 420 },
                children: [
                  {
                    id: 'ig-like-button',
                    resourceId: 'com.instagram.android:id/row_feed_button_like',
                    contentDescription: automationService.instagramLiked ? 'Liked' : 'Like',
                    text: automationService.instagramLiked ? 'Liked' : 'Like',
                    className: 'android.widget.ImageView',
                    clickable: true,
                    editable: false,
                    enabled: true,
                    bounds: { x: 16, y: 390, width: 32, height: 32 },
                  },
                  {
                    id: 'ig-comment-button',
                    resourceId: 'com.instagram.android:id/row_feed_button_comment',
                    contentDescription: 'Comment',
                    className: 'android.widget.ImageView',
                    clickable: true,
                    editable: false,
                    enabled: true,
                    bounds: { x: 56, y: 390, width: 32, height: 32 },
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    // Default System/Nova Screen Hierarchy
    return {
      id: 'node-root-system',
      packageName: pkg,
      className: 'android.widget.FrameLayout',
      clickable: false,
      editable: false,
      enabled: true,
      bounds: { x: 0, y: 0, width: 360, height: 740 },
      children: [
        {
          id: 'system-status-bar',
          resourceId: 'com.android.systemui:id/status_bar',
          className: 'android.view.View',
          clickable: false,
          editable: false,
          enabled: true,
          bounds: { x: 0, y: 0, width: 360, height: 24 },
        },
        {
          id: 'main-content-view',
          resourceId: 'com.nova.assistant:id/main_content',
          className: 'android.view.ViewGroup',
          clickable: false,
          editable: false,
          enabled: true,
          bounds: { x: 0, y: 24, width: 360, height: 716 },
          children: [
            {
              id: 'btn-search',
              resourceId: 'com.nova.assistant:id/btn_search',
              text: 'Search Phone',
              contentDescription: 'Search files, apps and settings',
              className: 'android.widget.Button',
              clickable: true,
              editable: false,
              enabled: true,
              bounds: { x: 20, y: 40, width: 320, height: 48 },
            },
            {
              id: 'input-query',
              resourceId: 'com.nova.assistant:id/input_query',
              text: '',
              contentDescription: 'Enter voice or text command',
              className: 'android.widget.EditText',
              clickable: true,
              editable: true,
              enabled: true,
              bounds: { x: 20, y: 100, width: 320, height: 48 },
            },
            {
              id: 'btn-emergency-stop',
              resourceId: 'com.nova.assistant:id/btn_emergency_stop',
              text: 'STOP AUTOMATION',
              contentDescription: 'Emergency Stop All Automation',
              className: 'android.widget.Button',
              clickable: true,
              editable: false,
              enabled: true,
              bounds: { x: 20, y: 160, width: 320, height: 44 },
            },
          ],
        },
      ],
    };
  }

  public onTreeChanged(listener: (tree: AccessibilityNodeInfo) => void): () => void {
    this.treeListeners.push(listener);
    return () => {
      this.treeListeners = this.treeListeners.filter((l) => l !== listener);
    };
  }

  public notifyTreeUpdated(): void {
    const tree = this.getRootInActiveWindow();
    this.treeListeners.forEach((l) => l(tree));
  }
}
