/**
 * BuyCourseScreen — purchase summary + Razorpay Checkout + verify.
 *
 * On outcome, navigates to dedicated PaymentSuccess / PaymentFailed screens.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/queryKeys';
import { AppButton } from '@/components/ui/AppButton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { useCourseDetailQuery } from '@/modules/courses/hooks/useCourseDetailQuery';
import { BuyCourseSummary } from '@/modules/payments/components/BuyCourseSummary';
import {
  RazorpayCheckoutWebView,
  type RazorpayCheckoutEvent,
  type RazorpayCheckoutOptions,
} from '@/modules/payments/components/RazorpayCheckoutWebView';
import { getBuyCoursePricing } from '@/modules/payments/utils/coursePricing';
import { createPaymentOrder, verifyPayment } from '@/services/payment.service';
import { useAuthStore } from '@/store/authStore';
import type { AppStackParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'BuyCourse'>;

type UiPhase = 'ready' | 'creating_order' | 'checkout' | 'verifying';

export function BuyCourseScreen({ navigation, route }: Props) {
  const { courseId } = route.params;
  const detailQuery = useCourseDetailQuery(courseId);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<UiPhase>('ready');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [checkoutOptions, setCheckoutOptions] = useState<RazorpayCheckoutOptions | null>(
    null,
  );

  const course = detailQuery.data;
  const pricing = useMemo(
    () =>
      course
        ? getBuyCoursePricing({
            price: course.price,
            is_free: course.is_free,
            compare_at_price: course.compare_at_price,
          })
        : null,
    [course],
  );

  const isBusy = phase === 'creating_order' || phase === 'verifying';

  const invalidateAfterPurchase = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.courseDetail(courseId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.chapters(courseId) }),
      queryClient.invalidateQueries({ queryKey: ['courses', 'list'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseHistory }),
    ]);
  }, [courseId, queryClient]);

  function goFailed(message: string) {
    setCheckoutOptions(null);
    setPhase('ready');
    setStatusMessage(null);
    navigation.replace('PaymentFailed', { courseId, message });
  }

  async function onBuyNow() {
    if (!course || !pricing) return;

    if (course.is_purchased) {
      Alert.alert('Already purchased', 'This course is already in My Learning.');
      return;
    }

    if (course.is_free || pricing.finalAmount <= 0) {
      navigation.replace('CourseDetail', { courseId });
      return;
    }

    setPhase('creating_order');
    setStatusMessage('Creating secure payment order…');
    setCheckoutOptions(null);

    try {
      const order = await createPaymentOrder(courseId);
      setCheckoutOptions({
        keyId: order.key_id,
        amountPaise: order.amount_paise,
        currency: order.currency,
        orderId: order.razorpay_order_id,
        courseTitle: order.course_title || course.title,
        prefillName:
          (user?.user_metadata?.full_name as string | undefined) ||
          (user?.user_metadata?.name as string | undefined) ||
          '',
        prefillEmail: user?.email ?? '',
        prefillContact: (user?.user_metadata?.phone as string | undefined) || '',
      });
      setPhase('checkout');
      setStatusMessage(null);
    } catch (error) {
      goFailed(getApiErrorMessage(error, 'Could not start payment.'));
    }
  }

  async function onCheckoutEvent(event: RazorpayCheckoutEvent) {
    setCheckoutOptions(null);

    if (event.type === 'cancel') {
      goFailed('Payment was cancelled. You can try again anytime.');
      return;
    }

    if (event.type === 'failure') {
      goFailed(event.description || 'Payment failed. Please try again.');
      return;
    }

    setPhase('verifying');
    setStatusMessage('Verifying payment with SHARANAM CLASSES…');

    try {
      await verifyPayment({
        razorpay_order_id: event.razorpay_order_id,
        razorpay_payment_id: event.razorpay_payment_id,
        razorpay_signature: event.razorpay_signature,
      });
      await invalidateAfterPurchase();
      navigation.replace('PaymentSuccess', {
        courseId,
        courseTitle: course?.title,
      });
    } catch (error) {
      goFailed(
        getApiErrorMessage(
          error,
          'Payment received but verification failed. Contact support if amount was deducted.',
        ),
      );
    }
  }

  if (detailQuery.isLoading && !course) {
    return (
      <Screen>
        <Text style={styles.loadingText}>Loading course…</Text>
      </Screen>
    );
  }

  if (detailQuery.isError || !course || !pricing) {
    return (
      <Screen>
        <ErrorState
          message={getApiErrorMessage(detailQuery.error, 'Course not found.')}
          onRetry={() => {
            void detailQuery.refetch();
          }}
        />
        <AppButton label="Go back" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Checkout</Text>
        <Text style={styles.title}>Buy Course</Text>
        <Text style={styles.subtitle}>
          Pay securely with Razorpay. Access unlocks only after server verification.
        </Text>

        <BuyCourseSummary
          courseName={course.title}
          teacherName={course.teacher_name?.trim() || 'SHARANAM Faculty'}
          pricing={pricing}
        />

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}

        <AppButton
          label="Buy Now"
          onPress={() => {
            void onBuyNow();
          }}
          loading={isBusy}
          disabled={isBusy || course.is_purchased || phase === 'checkout'}
        />

        <AppButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>

      <RazorpayCheckoutWebView
        visible={phase === 'checkout' && Boolean(checkoutOptions)}
        options={checkoutOptions}
        onEvent={(event) => {
          void onCheckoutEvent(event);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  loadingText: {
    color: '#A8B3C5',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  status: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
