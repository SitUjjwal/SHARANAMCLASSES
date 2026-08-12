/**
 * PaymentFailedScreen
 *
 * ❌ Payment Failed
 * [Try Again]
 * [Contact Support]
 */
import { Linking, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

/** Public support inbox — update when a dedicated address is ready */
const SUPPORT_EMAIL = 'sharanam.sp@gmail.com';

type Props = NativeStackScreenProps<AppStackParamList, 'PaymentFailed'>;

export function PaymentFailedScreen({ navigation, route }: Props) {
  const { courseId, message } = route.params;

  async function onContactSupport() {
    const subject = encodeURIComponent('Payment issue — SHARANAM CLASSES');
    const body = encodeURIComponent(
      message
        ? `Hi,\n\nI had a payment issue.\n\nDetails: ${message}\nCourse ID: ${courseId}\n`
        : `Hi,\n\nI had a payment issue for course ${courseId}.\n`,
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Mail app unavailable — user can still Try Again
    }
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✕</Text>
        </View>

        <Text style={styles.title}>Payment Failed</Text>

        {message ? (
          <Text style={styles.message} numberOfLines={4}>
            {message}
          </Text>
        ) : (
          <Text style={styles.message}>
            Something went wrong with your payment. You can try again or contact support.
          </Text>
        )}

        <View style={styles.rule} />

        <AppButton
          label="Try Again"
          onPress={() => navigation.replace('BuyCourse', { courseId })}
        />
        <AppButton label="Contact Support" variant="ghost" onPress={() => void onContactSupport()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229,115,115,0.18)',
    borderWidth: 2,
    borderColor: '#E57373',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    color: '#E57373',
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  rule: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: spacing.md,
  },
});
