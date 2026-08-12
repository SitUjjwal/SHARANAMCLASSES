/**
 * Expo app config — production-ready Android / iOS identity.
 *
 * Assets:
 *   icon.png              — app icon (1024×1024)
 *   adaptive-icon.png     — Android adaptive foreground
 *   splash-brand.png      — splash / brand mark
 *   notification-icon.png — Android status-bar icon (white + transparent)
 *
 * Versioning:
 *   version      — user-facing (1.0.0) — bump for store listing
 *   versionCode  — Android integer build number — MUST increase every Play upload
 *   buildNumber  — iOS string build number
 *
 * Place Firebase Android config at apps/mobile/google-services.json (gitignored)
 * when enabling FCM / Expo push in production builds.
 */
const fs = require('node:fs');
const path = require('node:path');

const googleServicesPath = path.resolve('google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

/** User-facing marketing version */
const APP_VERSION = '1.1.0';
/** Android versionCode (Play Store build number) */
const ANDROID_VERSION_CODE = 4;
/** iOS CFBundleVersion */
const IOS_BUILD_NUMBER = '1';

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'SHARANAM CLASSES',
  slug: 'sharanam-classes',
  version: APP_VERSION,
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
    buildNumber: IOS_BUILD_NUMBER,
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
      NSPhotoLibraryUsageDescription:
        'Allow SHARANAM CLASSES to access your photos so you can set a profile picture.',
      NSPhotoLibraryAddUsageDescription:
        'Allow SHARANAM CLASSES to save images when you share certificates or content.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1F3A',
    },
    edgeToEdgeEnabled: true,
    package: 'com.sharanam.classes',
    versionCode: ANDROID_VERSION_CODE,
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
      'READ_MEDIA_IMAGES',
      'WAKE_LOCK',
    ],
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
        /** White silhouette on transparent — required for Android status bar */
        icon: './assets/notification-icon.png',
        color: '#C9A227',
        defaultChannel: 'default',
        sounds: [],
      },
    ],
  ],
  extra: {
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    eas: {
      // https://expo.dev/accounts/ujjwalsharan/projects/sharanam-classes
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'd2cc3f6d-3ef7-4038-a29b-2966caee0c1b',
    },
  },
};

module.exports = { expo: config };
