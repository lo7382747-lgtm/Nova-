import {
  AutomationStep,
  AutomationExecutionState,
  ForegroundAppType,
  SystemSettingsState,
  SensitiveAppItem,
  AutomationActionType,
} from '../types';
import { resolveAppByName, INSTALLED_APPS_REGISTRY } from '../data/installedApps';
import { ActivityLogService } from './activityLogService';

export interface AccessibilityNode {
  id: string;
  type: 'button' | 'input' | 'text' | 'image' | 'container' | 'switch';
  text: string;
  contentDescription?: string;
  clickable: boolean;
  focusable: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  checked?: boolean;
}

export interface ScreenUITree {
  packageName: string;
  activityName: string;
  title: string;
  timestamp: number;
  nodes: AccessibilityNode[];
}

export class AutomationService {
  private static instance: AutomationService;

  private foregroundApp: ForegroundAppType = 'nova';
  private previousApp: ForegroundAppType = 'nova';
  private systemSettings: SystemSettingsState = {
    wifi: true,
    bluetooth: true,
    flashlight: false,
    volume: 75,
    brightness: 80,
    dnd: false,
    hotspot: false,
    batterySaver: false,
    airplaneMode: false,
    autoRotate: true,
    location: true,
    ringerMode: 'normal',
  };

  private executionState: AutomationExecutionState = {
    isActive: false,
    title: '',
    steps: [],
    currentStepIndex: 0,
    status: 'idle',
  };

  private isAborted = false;
  private appChangeListeners: ((app: ForegroundAppType) => void)[] = [];
  private settingsListeners: ((settings: SystemSettingsState) => void)[] = [];
  private executionListeners: ((state: AutomationExecutionState) => void)[] = [];
  private screenshotListeners: ((data: { id: string; timestamp: number; appName: string }) => void)[] = [];

  // Active in-app interaction simulation state
  public instagramLiked = false;
  public instagramScrollOffset = 0;
  public chromeSearchQuery = '';
  public chromeScrolled = false;
  public activeCallContact = '';
  public activeCallDuration = 0;
  public callTimerInterval: any = null;
  public isMediaPlaying = false;
  public currentMediaTrack = 'Midnight City — M83';

  // Alarms and Timers
  public alarms: { id: string; time: string; label: string; enabled: boolean }[] = [
    { id: 'alarm-1', time: '07:00 AM', label: 'Morning Alarm', enabled: true },
  ];
  public activeTimer: { id: string; label: string; remainingSeconds: number; totalSeconds: number } | null = null;
  private timerInterval: any = null;

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  // State Getters
  public getForegroundApp(): ForegroundAppType {
    return this.foregroundApp;
  }

  public getSystemSettings(): SystemSettingsState {
    return { ...this.systemSettings };
  }

  public getExecutionState(): AutomationExecutionState {
    return { ...this.executionState };
  }

  // Listeners
  public onForegroundAppChange(cb: (app: ForegroundAppType) => void): () => void {
    this.appChangeListeners.push(cb);
    return () => {
      this.appChangeListeners = this.appChangeListeners.filter((c) => c !== cb);
    };
  }

  public onSystemSettingsChange(cb: (settings: SystemSettingsState) => void): () => void {
    this.settingsListeners.push(cb);
    return () => {
      this.settingsListeners = this.settingsListeners.filter((c) => c !== cb);
    };
  }

  public onExecutionChange(cb: (state: AutomationExecutionState) => void): () => void {
    this.executionListeners.push(cb);
    return () => {
      this.executionListeners = this.executionListeners.filter((c) => c !== cb);
    };
  }

  public onScreenshotTaken(cb: (data: { id: string; timestamp: number; appName: string }) => void): () => void {
    this.screenshotListeners.push(cb);
    return () => {
      this.screenshotListeners = this.screenshotListeners.filter((c) => c !== cb);
    };
  }

  private notifyAppChange(): void {
    this.appChangeListeners.forEach((cb) => cb(this.foregroundApp));
  }

  private notifySettingsChange(): void {
    this.settingsListeners.forEach((cb) => cb({ ...this.systemSettings }));
  }

  private notifyExecutionChange(): void {
    this.executionListeners.forEach((cb) => cb({ ...this.executionState }));
  }

  // Set foreground app
  public setForegroundApp(app: ForegroundAppType): void {
    this.previousApp = this.foregroundApp;
    this.foregroundApp = app;
    this.notifyAppChange();
  }

  // Read current Screen Accessibility UI Tree
  public inspectAccessibilityTree(): ScreenUITree {
    const app = this.foregroundApp;
    const nodes: AccessibilityNode[] = [];

    switch (app) {
      case 'home':
        nodes.push(
          { id: 'btn_chrome', type: 'button', text: 'Chrome', contentDescription: 'Open Chrome Browser', clickable: true, focusable: true, bounds: { x: 40, y: 150, width: 60, height: 60 } },
          { id: 'btn_instagram', type: 'button', text: 'Instagram', contentDescription: 'Open Instagram Feed', clickable: true, focusable: true, bounds: { x: 120, y: 150, width: 60, height: 60 } },
          { id: 'btn_whatsapp', type: 'button', text: 'WhatsApp', contentDescription: 'Open WhatsApp Chat', clickable: true, focusable: true, bounds: { x: 200, y: 150, width: 60, height: 60 } },
          { id: 'btn_messages', type: 'button', text: 'Messages', contentDescription: 'Open SMS Messages', clickable: true, focusable: true, bounds: { x: 280, y: 150, width: 60, height: 60 } },
          { id: 'clock_widget', type: 'text', text: 'Clock Widget', clickable: false, focusable: false, bounds: { x: 20, y: 50, width: 320, height: 80 } }
        );
        return {
          packageName: 'com.google.android.apps.nexuslauncher',
          activityName: 'com.android.launcher3.uioverrides.QuickstepLauncher',
          title: 'Android Home Screen',
          timestamp: Date.now(),
          nodes,
        };

      case 'chrome':
        nodes.push(
          { id: 'chrome_url_bar', type: 'input', text: this.chromeSearchQuery || 'Search or type URL', contentDescription: 'Search or web address', clickable: true, focusable: true, bounds: { x: 20, y: 40, width: 320, height: 44 } },
          { id: 'chrome_tabs_btn', type: 'button', text: 'Tabs (3)', contentDescription: 'Open tab switcher', clickable: true, focusable: true, bounds: { x: 300, y: 40, width: 36, height: 36 } },
          { id: 'weather_card', type: 'container', text: 'Weather 72°F Sunny', contentDescription: 'Current Weather Information Card', clickable: true, focusable: false, bounds: { x: 20, y: 100, width: 320, height: 180 } }
        );
        return {
          packageName: 'com.android.chrome',
          activityName: 'com.google.android.apps.chrome.Main',
          title: 'Google Chrome',
          timestamp: Date.now(),
          nodes,
        };

      case 'instagram':
        nodes.push(
          { id: 'ig_post_author', type: 'text', text: 'nature_explorer', clickable: true, focusable: false, bounds: { x: 20, y: 70, width: 200, height: 30 } },
          { id: 'ig_post_image', type: 'image', text: 'Scenic mountain lake at sunset', contentDescription: 'Post photo: scenic lake', clickable: true, focusable: false, bounds: { x: 0, y: 105, width: 360, height: 320 } },
          { id: 'ig_like_btn', type: 'button', text: this.instagramLiked ? 'Liked (Red Heart)' : 'Like', contentDescription: 'Like post button', clickable: true, focusable: true, bounds: { x: 20, y: 435, width: 36, height: 36 } },
          { id: 'ig_comment_btn', type: 'button', text: 'Comment', contentDescription: 'Open comment tray', clickable: true, focusable: true, bounds: { x: 65, y: 435, width: 36, height: 36 } },
          { id: 'ig_feed_scroll_view', type: 'container', text: 'Main feed stream', contentDescription: 'Scrollable feed', clickable: true, focusable: true, bounds: { x: 0, y: 60, width: 360, height: 500 } }
        );
        return {
          packageName: 'com.instagram.android',
          activityName: 'com.instagram.mainactivity.MainActivity',
          title: 'Instagram Feed',
          timestamp: Date.now(),
          nodes,
        };

      case 'quick_settings':
        nodes.push(
          { id: 'qs_wifi', type: 'switch', text: 'Wi-Fi', contentDescription: 'Wi-Fi network toggle', clickable: true, focusable: true, checked: this.systemSettings.wifi, bounds: { x: 24, y: 80, width: 140, height: 50 } },
          { id: 'qs_bt', type: 'switch', text: 'Bluetooth', contentDescription: 'Bluetooth toggle', clickable: true, focusable: true, checked: this.systemSettings.bluetooth, bounds: { x: 180, y: 80, width: 140, height: 50 } },
          { id: 'qs_torch', type: 'switch', text: 'Flashlight', contentDescription: 'Flashlight toggle', clickable: true, focusable: true, checked: this.systemSettings.flashlight, bounds: { x: 24, y: 140, width: 140, height: 50 } },
          { id: 'qs_slider_bright', type: 'container', text: `Brightness ${this.systemSettings.brightness}%`, contentDescription: 'Brightness slider', clickable: true, focusable: true, bounds: { x: 24, y: 210, width: 300, height: 30 } }
        );
        return {
          packageName: 'com.android.systemui',
          activityName: 'com.android.systemui.qs.QSPanel',
          title: 'Quick Settings Panel',
          timestamp: Date.now(),
          nodes,
        };

      default:
        nodes.push({ id: 'root_view', type: 'container', text: 'Nova Assistant View', clickable: true, focusable: true, bounds: { x: 0, y: 0, width: 360, height: 640 } });
        return {
          packageName: 'com.nova.assistant',
          activityName: 'com.nova.assistant.MainActivity',
          title: 'Nova Assistant',
          timestamp: Date.now(),
          nodes,
        };
    }
  }

  // Open App
  public openApp(appName: string, denylist: SensitiveAppItem[] = []): { success: boolean; isSensitiveBlocked?: boolean; message: string } {
    const resolved = resolveAppByName(appName);
    if (!resolved) {
      return {
        success: false,
        message: `App "${appName}" could not be found among installed Android applications.`,
      };
    }

    // Check sensitive denylist
    const isSensitive = denylist.some(
      (s) => s.packageName.toLowerCase() === resolved.packageName.toLowerCase() ||
             s.name.toLowerCase() === resolved.name.toLowerCase() ||
             resolved.isSensitive
    );

    if (isSensitive) {
      this.setForegroundApp('denied_sensitive');
      return {
        success: false,
        isSensitiveBlocked: true,
        message: `For your security, autonomous control is disabled on financial and sensitive apps (${resolved.name}). Opened in manual-only mode.`,
      };
    }

    // Map to simulated app screens
    switch (resolved.id) {
      case 'chrome':
        this.setForegroundApp('chrome');
        break;
      case 'instagram':
        this.setForegroundApp('instagram');
        break;
      case 'messages':
        this.setForegroundApp('messages');
        break;
      case 'phone':
        this.setForegroundApp('phone_call');
        break;
      case 'settings':
        this.setForegroundApp('home');
        break;
      case 'whatsapp':
        this.setForegroundApp('home');
        break;
      default:
        this.setForegroundApp('home');
        break;
    }

    return {
      success: true,
      message: `Opened ${resolved.name} (${resolved.packageName}).`,
    };
  }

  // System Navigation Actions
  public goHome(): { success: boolean; message: string } {
    this.setForegroundApp('home');
    return { success: true, message: 'Returned to Android Home Screen.' };
  }

  public goBack(): { success: boolean; message: string } {
    if (this.foregroundApp === 'quick_settings') {
      this.setForegroundApp(this.previousApp);
      return { success: true, message: 'Closed Quick Settings.' };
    }
    this.setForegroundApp('home');
    return { success: true, message: 'Navigated back.' };
  }

  public openQuickSettings(): { success: boolean; message: string } {
    this.setForegroundApp('quick_settings');
    return { success: true, message: 'Opened Android Quick Settings panel.' };
  }

  public openNotifications(): { success: boolean; message: string } {
    this.setForegroundApp('quick_settings');
    return { success: true, message: 'Opened notification shade.' };
  }

  public openRecentApps(): { success: boolean; message: string } {
    this.setForegroundApp('home');
    return { success: true, message: 'Opened Recent Apps switcher.' };
  }

  public lockScreen(): { success: boolean; message: string } {
    this.setForegroundApp('home');
    return { success: true, message: 'Device screen locked.' };
  }

  // In-App Interactions
  public scrollScreen(direction: 'up' | 'down' | 'left' | 'right' = 'down', amount: 'small' | 'medium' | 'large' = 'medium'): { success: boolean; message: string } {
    if (this.foregroundApp === 'instagram') {
      const step = amount === 'large' ? 300 : amount === 'small' ? 120 : 200;
      this.instagramScrollOffset = Math.max(0, this.instagramScrollOffset + (direction === 'down' ? step : -step));
    } else if (this.foregroundApp === 'chrome') {
      this.chromeScrolled = true;
    }
    return { success: true, message: `Scrolled screen ${direction} (${amount}).` };
  }

  public tapElement(description: string, useVisionFallback = true): { success: boolean; message: string; coordinates?: { x: number; y: number } } {
    const cleanDesc = description.toLowerCase();

    // 1. First search via Accessibility Tree
    const tree = this.inspectAccessibilityTree();
    const matchedNode = tree.nodes.find((node) => {
      const nodeText = (node.text || '').toLowerCase();
      const nodeDesc = (node.contentDescription || '').toLowerCase();
      return (
        nodeText.includes(cleanDesc) ||
        cleanDesc.includes(nodeText) ||
        nodeDesc.includes(cleanDesc) ||
        cleanDesc.includes(nodeDesc)
      );
    });

    if (matchedNode) {
      // Direct accessibility match
      if (this.foregroundApp === 'instagram' && (cleanDesc.includes('like') || cleanDesc.includes('heart') || cleanDesc.includes('post'))) {
        this.instagramLiked = true;
        return { success: true, message: 'Tapped like button on Instagram post ❤️ via Accessibility node.' };
      }

      if (this.foregroundApp === 'chrome' && (cleanDesc.includes('search') || cleanDesc.includes('url') || cleanDesc.includes('weather') || cleanDesc.includes('input'))) {
        this.chromeSearchQuery = 'current weather forecast';
        return { success: true, message: 'Tapped Chrome address bar via Accessibility node and queried weather.' };
      }

      if (this.foregroundApp === 'quick_settings' && cleanDesc.includes('wifi')) {
        this.systemSettings.wifi = !this.systemSettings.wifi;
        this.notifySettingsChange();
        return { success: true, message: `Wi-Fi toggled to ${this.systemSettings.wifi ? 'ON' : 'OFF'}.` };
      }

      const centerX = Math.round(matchedNode.bounds.x + matchedNode.bounds.width / 2);
      const centerY = Math.round(matchedNode.bounds.y + matchedNode.bounds.height / 2);
      return {
        success: true,
        message: `Tapped "${matchedNode.text || description}" at (${centerX}, ${centerY}) via AccessibilityNodeInfo.`,
        coordinates: { x: centerX, y: centerY },
      };
    }

    // 2. Vision Fallback: MediaProjection screenshot analysis for WebViews, Canvas, Flutter or unlabelled views
    if (useVisionFallback) {
      // Calculate normalized visual coordinates
      const estimatedX = 180;
      const estimatedY = 320;
      return {
        success: true,
        message: `Accessibility node missing. Engaged MediaProjection Screenshot Vision Fallback: Detected "${description}" at (${estimatedX}, ${estimatedY}) with 94% confidence. Dispatched tap.`,
        coordinates: { x: estimatedX, y: estimatedY },
      };
    }

    return { success: true, message: `Dispatched tap gesture on "${description}".` };
  }

  // Vision fallback screenshot analyzer
  public async analyzeScreenWithVision(targetDescription: string): Promise<{ success: boolean; x: number; y: number; confidence: number; message: string }> {
    // Simulated MediaProjection capture + Gemini Flash vision analysis
    const x = 180;
    const y = 300;
    return {
      success: true,
      x,
      y,
      confidence: 0.95,
      message: `MediaProjection captured 1080x2400 frame. Gemini Vision localized "${targetDescription}" at coordinate (x: ${x}, y: ${y}).`,
    };
  }

  public typeText(text: string, target?: string): { success: boolean; message: string } {
    if (this.foregroundApp === 'chrome') {
      this.chromeSearchQuery = text;
    }
    return { success: true, message: `Typed "${text}" into ${target || 'focused text field'}.` };
  }

  public doubleTap(description: string): { success: boolean; message: string } {
    if (this.foregroundApp === 'instagram') {
      this.instagramLiked = true;
      return { success: true, message: 'Double-tapped post to like ❤️.' };
    }
    return { success: true, message: `Double-tapped on "${description}".` };
  }

  public longPress(description: string): { success: boolean; message: string } {
    return { success: true, message: `Long-pressed on "${description}".` };
  }

  // System Settings Controls
  public toggleSystemSetting(
    setting: 'wifi' | 'bluetooth' | 'flashlight' | 'volume' | 'brightness' | 'dnd' | 'hotspot' | 'batterySaver' | 'airplaneMode' | 'autoRotate' | 'location' | 'ringerMode',
    value?: boolean | number | string
  ): { success: boolean; message: string } {
    let msg = '';
    switch (setting) {
      case 'wifi':
        this.systemSettings.wifi = value !== undefined ? Boolean(value) : !this.systemSettings.wifi;
        msg = `Wi-Fi turned ${this.systemSettings.wifi ? 'ON' : 'OFF'}.`;
        break;
      case 'bluetooth':
        this.systemSettings.bluetooth = value !== undefined ? Boolean(value) : !this.systemSettings.bluetooth;
        msg = `Bluetooth turned ${this.systemSettings.bluetooth ? 'ON' : 'OFF'}.`;
        break;
      case 'flashlight':
        this.systemSettings.flashlight = value !== undefined ? Boolean(value) : !this.systemSettings.flashlight;
        msg = `Flashlight turned ${this.systemSettings.flashlight ? 'ON' : 'OFF'}.`;
        break;
      case 'volume':
        const vol = typeof value === 'number' ? value : 80;
        this.systemSettings.volume = Math.min(100, Math.max(0, vol));
        msg = `Volume set to ${this.systemSettings.volume}%.`;
        break;
      case 'brightness':
        const br = typeof value === 'number' ? value : 80;
        this.systemSettings.brightness = Math.min(100, Math.max(0, br));
        msg = `Brightness set to ${this.systemSettings.brightness}%.`;
        break;
      case 'dnd':
        return this.toggleDnd(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'hotspot':
        return this.toggleHotspot(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'batterySaver':
        return this.toggleBatterySaver(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'airplaneMode':
        return this.toggleAirplaneMode(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'autoRotate':
        return this.toggleAutoRotate(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'location':
        return this.toggleLocation(value !== undefined ? (value === 'on' || value === true) : undefined);
      case 'ringerMode':
        return this.setRingerMode((value as any) || 'normal');
    }

    this.notifySettingsChange();
    return { success: true, message: msg };
  }

  // Android Device Hardware Controls
  public takeScreenshot(): { success: boolean; message: string; screenshot: { id: string; timestamp: number; appName: string } } {
    const screenshot = {
      id: `screenshot-${Date.now()}`,
      timestamp: Date.now(),
      appName: this.foregroundApp === 'nova' ? 'Nova Assistant' : this.foregroundApp,
    };
    this.systemSettings.recentScreenshot = screenshot;
    this.notifySettingsChange();
    this.screenshotListeners.forEach((cb) => cb(screenshot));
    return {
      success: true,
      message: `Screenshot captured from ${screenshot.appName} and saved to Gallery 📸.`,
      screenshot,
    };
  }

  public toggleDnd(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.dnd = value !== undefined ? Boolean(value) : !this.systemSettings.dnd;
    this.notifySettingsChange();
    return { success: true, message: `Do Not Disturb turned ${this.systemSettings.dnd ? 'ON' : 'OFF'}.` };
  }

  public toggleHotspot(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.hotspot = value !== undefined ? Boolean(value) : !this.systemSettings.hotspot;
    this.notifySettingsChange();
    return { success: true, message: `Portable Hotspot turned ${this.systemSettings.hotspot ? 'ON' : 'OFF'}.` };
  }

  public toggleBatterySaver(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.batterySaver = value !== undefined ? Boolean(value) : !this.systemSettings.batterySaver;
    this.notifySettingsChange();
    return { success: true, message: `Battery Saver turned ${this.systemSettings.batterySaver ? 'ON' : 'OFF'}.` };
  }

  public toggleAirplaneMode(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.airplaneMode = value !== undefined ? Boolean(value) : !this.systemSettings.airplaneMode;
    if (this.systemSettings.airplaneMode) {
      this.systemSettings.wifi = false;
      this.systemSettings.bluetooth = false;
      this.systemSettings.hotspot = false;
    }
    this.notifySettingsChange();
    return { success: true, message: `Airplane mode turned ${this.systemSettings.airplaneMode ? 'ON' : 'OFF'}.` };
  }

  public toggleAutoRotate(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.autoRotate = value !== undefined ? Boolean(value) : !this.systemSettings.autoRotate;
    this.notifySettingsChange();
    return { success: true, message: `Auto-rotate screen turned ${this.systemSettings.autoRotate ? 'ON' : 'OFF'}.` };
  }

  public toggleLocation(value?: boolean): { success: boolean; message: string } {
    this.systemSettings.location = value !== undefined ? Boolean(value) : !this.systemSettings.location;
    this.notifySettingsChange();
    return { success: true, message: `Location (GPS) turned ${this.systemSettings.location ? 'ON' : 'OFF'}.` };
  }

  public setRingerMode(mode: 'normal' | 'vibrate' | 'silent'): { success: boolean; message: string } {
    this.systemSettings.ringerMode = mode;
    this.notifySettingsChange();
    const modeLabels: Record<string, string> = {
      normal: 'Normal (Sound on)',
      vibrate: 'Vibrate only',
      silent: 'Silent (Muted)',
    };
    return { success: true, message: `Ringer mode set to ${modeLabels[mode] || mode}.` };
  }

  public deviceHardwareControl(action: string, value?: string): { success: boolean; message: string } {
    const act = (action || '').toLowerCase();
    const boolVal = value !== undefined ? (value === 'on' || value === 'true') : undefined;

    if (act.includes('screenshot')) {
      return this.takeScreenshot();
    }
    if (act.includes('dnd') || act.includes('disturb')) {
      return this.toggleDnd(boolVal);
    }
    if (act.includes('hotspot')) {
      return this.toggleHotspot(boolVal);
    }
    if (act.includes('batterysaver') || act.includes('saver')) {
      return this.toggleBatterySaver(boolVal);
    }
    if (act.includes('airplane')) {
      return this.toggleAirplaneMode(boolVal);
    }
    if (act.includes('autorotate') || act.includes('rotate')) {
      return this.toggleAutoRotate(boolVal);
    }
    if (act.includes('location') || act.includes('gps')) {
      return this.toggleLocation(boolVal);
    }
    if (act.includes('ring') || act.includes('silent') || act.includes('vibrate')) {
      const mode = (value as any) || (act.includes('silent') ? 'silent' : act.includes('vibrate') ? 'vibrate' : 'normal');
      return this.setRingerMode(mode);
    }
    if (act.includes('battery')) {
      return this.getBatteryStatus();
    }
    if (act.includes('lock')) {
      return this.lockScreen();
    }
    return { success: true, message: `Executed device control: ${action}` };
  }

  // Calls and Media
  public makeCall(contactName: string): { success: boolean; message: string } {
    this.activeCallContact = contactName;
    this.activeCallDuration = 0;
    this.setForegroundApp('phone_call');

    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    this.callTimerInterval = setInterval(() => {
      this.activeCallDuration += 1;
    }, 1000);

    return { success: true, message: `Calling ${contactName}...` };
  }

  public endCall(): { success: boolean; message: string } {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
    const contact = this.activeCallContact || 'Call';
    this.activeCallContact = '';
    this.setForegroundApp('home');
    return { success: true, message: `Ended call with ${contact}.` };
  }

  public playMedia(appName = 'Spotify', query = ''): { success: boolean; message: string } {
    this.isMediaPlaying = true;
    if (query) {
      this.currentMediaTrack = query;
    }
    return { success: true, message: `Playing ${this.currentMediaTrack} on ${appName}.` };
  }

  public pauseMedia(): { success: boolean; message: string } {
    this.isMediaPlaying = false;
    return { success: true, message: 'Media playback paused.' };
  }

  // Alarms and Timers
  public setAlarm(time: string, label = 'Alarm'): { success: boolean; message: string } {
    const cleanTime = time.trim() || '07:00 AM';
    const newAlarm = {
      id: `alarm-${Date.now()}`,
      time: cleanTime,
      label,
      enabled: true,
    };
    this.alarms.push(newAlarm);
    return { success: true, message: `Alarm set for ${cleanTime} (${label}).` };
  }

  public setTimer(minutes: number, label = 'Timer'): { success: boolean; message: string } {
    const totalSec = Math.max(1, Math.round(minutes * 60));
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.activeTimer = {
      id: `timer-${Date.now()}`,
      label,
      remainingSeconds: totalSec,
      totalSeconds: totalSec,
    };
    this.timerInterval = setInterval(() => {
      if (!this.activeTimer) {
        clearInterval(this.timerInterval);
        return;
      }
      this.activeTimer.remainingSeconds -= 1;
      if (this.activeTimer.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.activeTimer = null;
      }
    }, 1000);
    return { success: true, message: `Timer set for ${minutes} minute${minutes === 1 ? '' : 's'}.` };
  }

  public adjustVolume(direction: 'up' | 'down' | 'mute' | 'max'): { success: boolean; message: string } {
    let current = this.systemSettings.volume;
    if (direction === 'up') current = Math.min(100, current + 15);
    else if (direction === 'down') current = Math.max(0, current - 15);
    else if (direction === 'mute') current = 0;
    else if (direction === 'max') current = 100;
    this.systemSettings.volume = current;
    this.notifySettingsChange();
    return { success: true, message: `Volume set to ${current}%.` };
  }

  public getBatteryStatus(): { success: boolean; message: string; level: number } {
    return {
      success: true,
      message: 'Battery level is 85%, fully healthy.',
      level: 85,
    };
  }

  // Abort running automation chain
  public abortChain(): void {
    this.isAborted = true;
    this.executionState = {
      ...this.executionState,
      status: 'aborted',
      isActive: false,
    };
    this.notifyExecutionChange();
  }

  // Multi-step Chaining Engine
  public async executeChain(
    title: string,
    steps: AutomationStep[],
    denylist: SensitiveAppItem[] = [],
    onStepUpdate?: (step: AutomationStep, index: number) => void
  ): Promise<{ success: boolean; message: string; trace: { title: string; status: 'completed' | 'failed' | 'skipped'; detail?: string }[] }> {
    this.isAborted = false;

    this.executionState = {
      isActive: true,
      title,
      steps: steps.map((s) => ({ ...s, status: 'pending' })),
      currentStepIndex: 0,
      status: 'running',
      startTime: Date.now(),
    };
    this.notifyExecutionChange();

    const trace: { title: string; status: 'completed' | 'failed' | 'skipped'; detail?: string }[] = [];
    let allSucceeded = true;
    let finalMessage = '';

    for (let i = 0; i < steps.length; i++) {
      if (this.isAborted) {
        trace.push({ title: steps[i].title, status: 'skipped', detail: 'Aborted by user' });
        continue;
      }

      this.executionState.currentStepIndex = i;
      this.executionState.steps[i].status = 'running';
      this.notifyExecutionChange();
      onStepUpdate?.(this.executionState.steps[i], i);

      // Pre-step inspect
      this.inspectAccessibilityTree();

      // UI execution simulated delay for human visual feedback
      await new Promise((resolve) => setTimeout(resolve, 550));

      if (this.isAborted) break;

      const step = steps[i];
      const startMs = Date.now();
      let result: { success: boolean; message: string; isSensitiveBlocked?: boolean } = { success: true, message: '' };

      switch (step.actionType) {
        case 'open_app':
          result = this.openApp(step.appName || step.params?.appName || 'Chrome', denylist);
          break;
        case 'go_home':
          result = this.goHome();
          break;
        case 'go_back':
          result = this.goBack();
          break;
        case 'open_quick_settings':
          result = this.openQuickSettings();
          break;
        case 'scroll':
          result = this.scrollScreen(step.params?.direction || 'down', step.params?.amount || 'medium');
          break;
        case 'tap':
          result = this.tapElement(step.description || step.params?.description || 'element');
          break;
        case 'double_tap':
          result = this.doubleTap(step.description || step.params?.description || 'element');
          break;
        case 'type':
          result = this.typeText(step.params?.text || 'weather', step.params?.target);
          break;
        case 'toggle_setting':
          result = this.toggleSystemSetting(step.params?.setting || 'wifi', step.params?.value);
          break;
        case 'make_call':
          result = this.makeCall(step.params?.contactName || 'Rahul');
          break;
        case 'end_call':
          result = this.endCall();
          break;
        case 'play_media':
          result = this.playMedia(step.params?.appName, step.params?.query);
          break;
        case 'pause_media':
          result = this.pauseMedia();
          break;
        case 'set_alarm':
          result = this.setAlarm(step.params?.time || '07:00 AM', step.params?.label || 'Alarm');
          break;
        case 'set_timer':
          result = this.setTimer(Number(step.params?.minutes || step.params?.time) || 5, step.params?.label || 'Timer');
          break;
        case 'take_screenshot':
          result = this.takeScreenshot();
          break;
        case 'device_control':
          result = this.deviceHardwareControl(step.params?.action || 'takeScreenshot', step.params?.value);
          break;
        default:
          result = { success: true, message: `Executed ${step.actionType}` };
          break;
      }

      const elapsed = Date.now() - startMs;
      this.executionState.steps[i].latencyMs = elapsed;

      if (result.success) {
        this.executionState.steps[i].status = 'completed';
        trace.push({ title: step.title, status: 'completed', detail: result.message });
      } else {
        allSucceeded = false;
        this.executionState.steps[i].status = 'failed';
        this.executionState.steps[i].error = result.message;
        trace.push({ title: step.title, status: 'failed', detail: result.message });
        finalMessage = result.message;
        break; // Stop immediately rather than guessing blindly!
      }

      this.notifyExecutionChange();
      onStepUpdate?.(this.executionState.steps[i], i);
    }

    const isComplete = !this.isAborted && allSucceeded;
    this.executionState = {
      ...this.executionState,
      status: this.isAborted ? 'aborted' : isComplete ? 'completed' : 'error',
      isActive: false,
    };
    this.notifyExecutionChange();

    // Log in ActivityLogService
    ActivityLogService.getInstance().addActivity({
      actionType: 'phone_automation',
      status: isComplete ? 'sent' : 'failed',
      message: title,
      failureReason: !allSucceeded ? finalMessage : undefined,
      automationTrace: {
        actionSummary: title,
        steps: trace,
      },
    });

    return {
      success: isComplete,
      message: finalMessage || `Completed all ${steps.length} actions for: "${title}".`,
      trace,
    };
  }
}

export const automationService = AutomationService.getInstance();
