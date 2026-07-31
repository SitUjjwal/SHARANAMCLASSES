/**
 * PaymentSuccessScreen
 *
 * ✅ Payment Successful
 * Thank you!
 * Course Unlocked
 * [Go To Course]
 */
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '@/components/ui/AppButton';
import { Screen } from '@/components/ui/Screen';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen({ navigation, route }: Props) {
  const { courseId, courseTitle } = route.params;

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>✓</Text>
        </View>

        <Text style={styles.title}>Payment Successful</Text>
        <Text style={styles.thankYou}>Thank you!</Text>
        <Text style={styles.unlocked}>Course Unlocked</Text>

        {courseTitle ? (
          <Text style={styles.courseName} numberOfLines={2}>
            {courseTitle}
          </Text>
        ) : null}

        <View style={styles.rule} />

        <AppButton
          label="Go To Course"
          onPress={() => navigation.replace('CourseDetail', { courseId })}
        />
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
    backgroundColor: 'rgba(129,199,132,0.2)',
    borderWidth: 2,
    borderColor: '#81C784',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    color: '#81C784',
    fontSize: 36,
    fontWeight: '800',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  thankYou: {
    color: colors.accent,
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
  unlocked: {
    color: '#81C784',
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  courseName: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  rule: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: spacing.md,
  },
});
