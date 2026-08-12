/**
 * Decide force / optional / none from live policy + client SemVer.
 */
import type { AppUpdatePolicy, AppVersionCheckResult, AppVersionPolicyConfig } from '../types/appVersion';
import { semverGte, semverLt } from './semver';

const DEFAULT_ANDROID =
  'https://play.google.com/store/apps/details?id=com.sharanam.classes';

export function resolveRecommendedVersion(config: AppVersionPolicyConfig): string {
  const rec = config.recommended_app_version?.trim();
  if (rec) return rec;
  return config.app_version;
}

export function evaluateAppUpdate(
  clientVersion: string,
  config: AppVersionPolicyConfig,
  opts: { platform?: string } = {},
): AppVersionCheckResult {
  const latest = config.app_version || '1.0.0';
  const min = config.min_app_version || '1.0.0';
  const recommended = resolveRecommendedVersion(config);
  const platform = (opts.platform ?? '').toLowerCase();

  const belowMin = semverLt(clientVersion, min);
  const belowLatest = semverLt(clientVersion, latest);
  const belowRecommended = semverLt(clientVersion, recommended);

  let policy: AppUpdatePolicy = 'none';
  if (belowMin || (config.force_update && belowLatest)) {
    policy = 'force';
  } else if (config.optional_update && (belowRecommended || belowLatest)) {
    policy = 'optional';
  }

  const storeAndroid = config.store_url_android?.trim() || DEFAULT_ANDROID;
  const storeIos = config.store_url_ios?.trim() || '';
  const store_url =
    platform === 'ios' ? storeIos || storeAndroid : storeAndroid || storeIos || null;

  let message = 'You are on the latest supported version.';
  if (policy === 'force') {
    message = 'A required update is available. Please update to continue using the app.';
  } else if (policy === 'optional') {
    message = 'A new version is available. Update when convenient for the latest features.';
  }

  return {
    policy,
    client_version: clientVersion,
    latest_version: latest,
    min_app_version: min,
    recommended_app_version: recommended,
    force_update: config.force_update,
    optional_update: config.optional_update,
    release_notes: config.release_notes ?? '',
    android_build_number: config.android_build_number ?? 0,
    ios_build_number: config.ios_build_number ?? '',
    store_url,
    store_url_android: storeAndroid,
    store_url_ios: storeIos,
    message,
  };
}

export function isClientAllowed(clientVersion: string, config: AppVersionPolicyConfig): boolean {
  return evaluateAppUpdate(clientVersion, config).policy !== 'force';
}

export function clientNeedsOptionalUpdate(
  clientVersion: string,
  config: AppVersionPolicyConfig,
): boolean {
  return evaluateAppUpdate(clientVersion, config).policy === 'optional';
}

export { semverGte };
