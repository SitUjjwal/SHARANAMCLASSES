/**
 * Dynamic Expo config — only attach google-services.json when the file exists.
 * Place Firebase Android config at apps/mobile/google-services.json (gitignored).
 */
const fs = require('node:fs');
const path = require('node:path');

const googleServicesPath = path.resolve('google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'SHARANAM CLASSES',
  slug: 'sharanam-classes',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  scheme: 'sharanam',
  splash: {
    image: './assets/splash-brand.png',
    resizeMode: 'contain',
    backgroundColor: '#0A3D2E',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.sharanamclasses.app',
    infoPlist: {
      LSApplicationQueriesSchemes: [
        'youtube',
        'vnd.youtube',
        'whatsapp',
        'fb',
        'instagram',
        'comgooglemaps',
        'tel',
        'mailto',
      ],
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1F3A',
    },
    edgeToEdgeEnabled: true,
    package: 'com.sharanamclasses.app',
    ...(hasGoogleServices ? { googleServicesFile: './google-services.json' } : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow SHARANAM CLASSES to access your photos so you can set a profile picture.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-brand.png',
        resizeMode: 'contain',
        backgroundColor: '#0A3D2E',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#C9A227',
        defaultChannel: 'default',
      },
    ],
  ],
  extra: {
    eas: {
      // Replace after `eas init` — needed for Expo push token fallback in Expo Go.
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || undefined,
    },
  },
};

module.exports = { expo: config };
