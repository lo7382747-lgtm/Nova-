export interface InstalledApp {
  id: string;
  name: string;
  aliases: string[];
  packageName: string;
  category: 'system' | 'social' | 'browser' | 'media' | 'finance' | 'tools';
  icon: string;
  isSensitive?: boolean;
}

export const INSTALLED_APPS_REGISTRY: InstalledApp[] = [
  {
    id: 'chrome',
    name: 'Google Chrome',
    aliases: ['chrome', 'browser', 'google chrome', 'internet', 'web'],
    packageName: 'com.android.chrome',
    category: 'browser',
    icon: 'chrome',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    aliases: ['instagram', 'insta', 'ig'],
    packageName: 'com.instagram.android',
    category: 'social',
    icon: 'instagram',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    aliases: ['whatsapp', 'wa', 'whats app'],
    packageName: 'com.whatsapp',
    category: 'social',
    icon: 'whatsapp',
  },
  {
    id: 'messages',
    name: 'Messages (SMS)',
    aliases: ['messages', 'sms', 'text', 'texts', 'text message', 'messaging'],
    packageName: 'com.google.android.apps.messaging',
    category: 'social',
    icon: 'messages',
  },
  {
    id: 'phone',
    name: 'Phone',
    aliases: ['phone', 'dialer', 'call', 'telephone'],
    packageName: 'com.google.android.dialer',
    category: 'system',
    icon: 'phone',
  },
  {
    id: 'camera',
    name: 'Camera',
    aliases: ['camera', 'photos shoot', 'cam'],
    packageName: 'com.android.camera',
    category: 'system',
    icon: 'camera',
  },
  {
    id: 'settings',
    name: 'Settings',
    aliases: ['settings', 'system settings', 'config'],
    packageName: 'com.android.settings',
    category: 'system',
    icon: 'settings',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    aliases: ['spotify', 'music', 'player', 'songs'],
    packageName: 'com.spotify.music',
    category: 'media',
    icon: 'spotify',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    aliases: ['calendar', 'events', 'schedule'],
    packageName: 'com.google.android.calendar',
    category: 'tools',
    icon: 'calendar',
  },
  {
    id: 'clock',
    name: 'Clock',
    aliases: ['clock', 'alarm', 'timer', 'stopwatch'],
    packageName: 'com.google.android.deskclock',
    category: 'tools',
    icon: 'clock',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    aliases: ['google pay', 'gpay', 'pay', 'wallet'],
    packageName: 'com.google.android.apps.walletnfcrel',
    category: 'finance',
    icon: 'gpay',
    isSensitive: true,
  },
  {
    id: 'chase',
    name: 'Chase Mobile',
    aliases: ['chase', 'chase bank', 'chase mobile'],
    packageName: 'com.chase.sig.android',
    category: 'finance',
    icon: 'chase',
    isSensitive: true,
  },
];

export function resolveAppByName(query: string): InstalledApp | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // Exact alias or name match
  const exact = INSTALLED_APPS_REGISTRY.find(
    (app) => app.name.toLowerCase() === clean || app.aliases.includes(clean)
  );
  if (exact) return exact;

  // Substring match
  const partial = INSTALLED_APPS_REGISTRY.find(
    (app) =>
      clean.includes(app.name.toLowerCase()) ||
      app.aliases.some((alias) => clean.includes(alias))
  );
  return partial || null;
}
