/**
 * App version management — policy, check result, release history.
 */
export type AppUpdatePolicy = 'none' | 'optional' | 'force';

/** Fields controlling client update UX (also mirrored on platform general settings). */
export type AppVersionPolicyConfig = {
  /** Latest published marketing version (SemVer). */
  app_version: string;
  /** Clients below this MUST update (force). */
  min_app_version: string;
  /**
   * Clients below this (but ≥ min) SHOULD update (optional).
   * Defaults to app_version when empty.
   */
  recommended_app_version: string;
  /** When true, any client below app_version is forced to update. */
  force_update: boolean;
  /** When true, soft prompt if below recommended / latest (unless force applies). */
  optional_update: boolean;
  /** Release notes for the current app_version. */
  release_notes: string;
  /** Latest Android versionCode shipped to stores. */
  android_build_number: number;
  /** Latest iOS CFBundleVersion. */
  ios_build_number: string;
  store_url_android: string;
  store_url_ios: string;
};

export type AppVersionHistoryEntry = {
  id: string;
  version: string;
  android_build_number: number | null;
  ios_build_number: string | null;
  release_notes: string;
  force_update: boolean;
  published_at: string;
  created_by: string | null;
  created_at: string;
};

export type CreateAppVersionReleaseInput = {
  version: string;
  release_notes?: string;
  android_build_number?: number | null;
  ios_build_number?: string | null;
  force_update?: boolean;
  /** Also write into platform_settings.general as the live policy. */
  publish_as_current?: boolean;
  min_app_version?: string;
  recommended_app_version?: string;
  optional_update?: boolean;
  store_url_android?: string;
  store_url_ios?: string;
};

export type AppVersionCheckRequest = {
  client_version: string;
  platform?: 'android' | 'ios' | 'web' | string;
  build_number?: string | number | null;
};

export type AppVersionCheckResult = {
  policy: AppUpdatePolicy;
  client_version: string;
  latest_version: string;
  min_app_version: string;
  recommended_app_version: string;
  force_update: boolean;
  optional_update: boolean;
  release_notes: string;
  android_build_number: number;
  ios_build_number: string;
  store_url: string | null;
  store_url_android: string;
  store_url_ios: string;
  message: string;
};
