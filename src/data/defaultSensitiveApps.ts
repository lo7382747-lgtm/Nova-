import { SensitiveAppItem } from '../types';

export const DEFAULT_SENSITIVE_APPS: SensitiveAppItem[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    packageName: 'com.google.android.apps.walletnfcrel',
    category: 'payment',
    description: 'UPI and digital card payments',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    packageName: 'com.phonepe.app',
    category: 'payment',
    description: 'UPI transfers and merchant transactions',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    packageName: 'net.one97.paytm',
    category: 'payment',
    description: 'Wallet and banking payments',
  },
  {
    id: 'chase',
    name: 'Chase Mobile',
    packageName: 'com.chase.sig.android',
    category: 'banking',
    description: 'Personal banking and wire transfers',
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    packageName: 'com.infonow.bofa',
    category: 'banking',
    description: 'Checking, savings and credit management',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    packageName: 'com.paypal.android.p2pmobile',
    category: 'payment',
    description: 'International payments and money transfers',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    packageName: 'com.venmo',
    category: 'payment',
    description: 'Peer-to-peer social payment transfers',
  },
  {
    id: 'binance',
    name: 'Binance',
    packageName: 'com.binance.dev',
    category: 'crypto',
    description: 'Cryptocurrency trading and wallet',
  },
  {
    id: 'android-security',
    name: 'Security & Biometrics',
    packageName: 'com.android.settings.security',
    category: 'security',
    description: 'Device lock screen, fingerprint, and PIN management',
  },
];
