/**
 * Blocks or prompts when remote policy requires an update.
 */
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { evaluateAppUpdate, type AppVersionCheckResult } from '@sharanam/shared';

import { AppButton } from '@/components/ui/AppButton';
import { usePublicPlatformQuery } from '@/modules/platform/hooks/usePublicPlatformQuery';
import { useAppTheme } from '@/theme/ThemeProvider';
import { spacing, typography } from '@/theme';

const DISMISS_KEY = 'app_update_dismissed_version';

function clientSemver(): string {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export function AppUpdateGate({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  const { data: platform } = usePublicPlatformQuery();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void SecureStore.getItemAsync(DISMISS_KEY)
      .then((v) => {
        setDismissedFor(v);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const check: AppVersionCheckResult | null = useMemo(() => {
    if (!platform) return null;
    return evaluateAppUpdate(
      clientSemver(),
      {
        app_version: platform.app_version,
        min_app_version: platform.min_app_version,
        recommended_app_version: platform.recommended_app_version || platform.app_version,
        force_update: platform.force_update,
        optional_update: platform.optional_update,
        release_notes: platform.release_notes ?? '',
        android_build_number: platform.android_build_number ?? 1,
        ios_build_number: platform.ios_build_number ?? '1',
        store_url_android: platform.store_url_android ?? '',
        store_url_ios: platform.store_url_ios ?? '',
      },
      { platform: Platform.OS },
    );
  }, [platform]);

  const showForce = check?.policy === 'force';
  const showOptional =
    check?.policy === 'optional' && ready && dismissedFor !== check.latest_version;

  const openStore = useCallback(async () => {
    const url = check?.store_url;
    if (!url) return;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
  }, [check?.store_url]);

  const dismissOptional = useCallback(async () => {
    if (!check) return;
    await SecureStore.setItemAsync(DISMISS_KEY, check.latest_version);
    setDismissedFor(check.latest_version);
  }, [check]);

  const visible = Boolean(showForce || showOptional);

  return (
    <>
      {children}
      <Modal visible={visible} animationType="fade" transparent={!showForce}>
        <View
          style={[
            styles.backdrop,
            showForce ? { backgroundColor: theme.canvas } : styles.dim,
          ]}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {showForce ? 'Update required' : 'Update available'}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              You have {check?.client_version} · Latest {check?.latest_version}
              {Platform.OS === 'android' && check?.android_build_number
                ? ` (build ${check.android_build_number})`
                : ''}
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{check?.message}</Text>
            {check?.release_notes ? (
              <View style={styles.notesBox}>
                <Text style={[styles.notesLabel, { color: theme.accent }]}>What’s new</Text>
                <Text style={[styles.notes, { color: theme.textPrimary }]}>
                  {check.release_notes}
                </Text>
              </View>
            ) : null}
            <AppButton label="Update now" onPress={() => void openStore()} />
            {showOptional ? (
              <View style={{ marginTop: spacing.sm }}>
                <AppButton label="Not now" variant="ghost" onPress={() => void dismissOptional()} />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dim: {
    backgroundColor: 'rgba(10, 20, 35, 0.72)',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  meta: {
    fontSize: typography.fontSize.sm,
  },
  body: {
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  notesBox: {
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  notes: {
    fontSize: typography.fontSize.md,
    lineHeight: 20,
  },
});
