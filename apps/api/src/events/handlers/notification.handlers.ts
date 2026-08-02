/**
 * Notification Service subscribers for domain events.
 *
 * Domain services MUST NOT call createAndMaybeSendNotification directly
 * (except admin compose + Reminder Engine jobs). Features emit events; we map here.
 */
import type {
  ChapterPublishedEvent,
  CourseUpdatedEvent,
  LiveClassScheduledEvent,
  PaymentCompletedEvent,
  TestScheduledEvent,
} from '@sharanam/shared';

import { createAndMaybeSendNotification } from '../../services/notification.service';
import { domainEventBus } from '../bus';

function formatInr(amountPaise: number): string {
  return `₹${Math.round(amountPaise / 100).toLocaleString('en-IN')}`;
}

async function onPaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
  const { payload } = event;
  const title = 'Payment successful';
  const body = payload.enrolled
    ? `${payload.product_title} is unlocked. Start learning now.`
    : `Payment of ${formatInr(payload.amount_paise)} for ${payload.product_title} succeeded.`;

  await createAndMaybeSendNotification(
    {
      title,
      body,
      deep_link: payload.course_id
        ? `sharanam://course/${payload.course_id}`
        : 'sharanam://payments',
      data: {
        type: 'payment',
        event: event.type,
        payment_order_id: payload.payment_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        ...(payload.course_id ? { course_id: payload.course_id } : {}),
      },
      notification_type: 'payment',
      audience_type: 'single_user',
      audience_user_id: payload.user_id,
      send: true,
    },
    null,
  );
}

async function onCourseUpdated(event: CourseUpdatedEvent): Promise<void> {
  const { payload } = event;
  if (!payload.is_published) {
    return;
  }

  const justPublished =
    payload.previous_is_published === false && payload.is_published === true;

  const meaningful = payload.updated_fields.some((f) =>
    ['title', 'description', 'thumbnail_url', 'is_published', 'features'].includes(f),
  );
  if (!justPublished && !meaningful) {
    return;
  }

  const title = justPublished ? 'New course available' : 'Course updated';
  const body = justPublished
    ? `${payload.title} is now live.`
    : `${payload.title} was updated. Check out what’s new.`;

  // Newly published → broadcast; updates → enrolled students only
  if (justPublished) {
    await createAndMaybeSendNotification(
      {
        title,
        body,
        deep_link: `sharanam://course/${payload.course_id}`,
        data: {
          type: 'course',
          event: event.type,
          course_id: payload.course_id,
        },
        notification_type: 'course_update',
        audience_type: 'all_users',
        send: true,
      },
      null,
    );
    return;
  }

  await createAndMaybeSendNotification(
    {
      title,
      body,
      deep_link: `sharanam://course/${payload.course_id}`,
      data: {
        type: 'course',
        event: event.type,
        course_id: payload.course_id,
      },
      notification_type: 'course_update',
      audience_type: 'course',
      audience_course_id: payload.course_id,
      send: true,
    },
    null,
  );
}

async function onChapterPublished(event: ChapterPublishedEvent): Promise<void> {
  const { payload } = event;
  await createAndMaybeSendNotification(
    {
      title: 'New chapter available',
      body: `${payload.title} was added to ${payload.course_title}.`,
      deep_link: `sharanam://course/${payload.course_id}`,
      data: {
        type: 'chapter',
        event: event.type,
        chapter_id: payload.chapter_id,
        course_id: payload.course_id,
      },
      notification_type: 'course_update',
      audience_type: 'course',
      audience_course_id: payload.course_id,
      send: true,
    },
    null,
  );
}

async function onLiveClassScheduled(event: LiveClassScheduledEvent): Promise<void> {
  const { payload } = event;
  await createAndMaybeSendNotification(
    {
      title: 'Live class scheduled',
      body: `${payload.title} is coming up. We’ll remind you before it starts.`,
      deep_link: `sharanam://live/${payload.live_class_id}`,
      data: {
        type: 'live_class',
        event: event.type,
        live_class_id: payload.live_class_id,
        ...(payload.course_id ? { course_id: payload.course_id } : {}),
      },
      notification_type: 'live_class',
      audience_type: payload.course_id ? 'course' : 'all_users',
      audience_course_id: payload.course_id ?? undefined,
      send: true,
    },
    null,
  );
}

async function onTestScheduled(event: TestScheduledEvent): Promise<void> {
  const { payload } = event;
  await createAndMaybeSendNotification(
    {
      title: 'New test scheduled',
      body: `${payload.title} is on the calendar. Prepare ahead of time.`,
      deep_link: `sharanam://test/${payload.test_id}`,
      data: {
        type: 'test',
        event: event.type,
        test_id: payload.test_id,
        ...(payload.course_id ? { course_id: payload.course_id } : {}),
      },
      notification_type: 'test_reminder',
      audience_type: payload.course_id ? 'course' : 'all_users',
      audience_course_id: payload.course_id ?? undefined,
      send: true,
    },
    null,
  );
}

export function registerNotificationEventHandlers(): void {
  domainEventBus.on('payment.completed', onPaymentCompleted);
  domainEventBus.on('course.updated', onCourseUpdated);
  domainEventBus.on('chapter.published', onChapterPublished);
  domainEventBus.on('live_class.scheduled', onLiveClassScheduled);
  domainEventBus.on('test.scheduled', onTestScheduled);
  console.log('[events] notification handlers registered');
}
