/**
 * Typed helpers for emitting domain events from feature services.
 */
import type {
  ChapterPublishedPayload,
  CourseUpdatedPayload,
  DomainEvent,
  LiveClassScheduledPayload,
  PaymentCompletedPayload,
  TestScheduledPayload,
} from '@sharanam/shared';

import { emitDomainEvent } from './bus';

function stamp<T extends DomainEvent>(
  partial: Omit<T, 'occurred_at'> & { occurred_at?: string },
): T {
  return {
    ...partial,
    occurred_at: partial.occurred_at ?? new Date().toISOString(),
  } as T;
}

export function emitPaymentCompleted(
  payload: PaymentCompletedPayload,
  idempotencyKey?: string,
): void {
  emitDomainEvent(
    stamp({
      type: 'payment.completed',
      idempotency_key: idempotencyKey ?? `payment:${payload.payment_order_id}`,
      payload,
    }),
  );
}

export function emitCourseUpdated(payload: CourseUpdatedPayload): void {
  emitDomainEvent(
    stamp({
      type: 'course.updated',
      idempotency_key: `course:${payload.course_id}:updated`,
      payload,
    }),
  );
}

export function emitChapterPublished(payload: ChapterPublishedPayload): void {
  emitDomainEvent(
    stamp({
      type: 'chapter.published',
      idempotency_key: `chapter:${payload.chapter_id}:published`,
      payload,
    }),
  );
}

export function emitLiveClassScheduled(payload: LiveClassScheduledPayload): void {
  emitDomainEvent(
    stamp({
      type: 'live_class.scheduled',
      idempotency_key: `live:${payload.live_class_id}:scheduled`,
      payload,
    }),
  );
}

export function emitTestScheduled(payload: TestScheduledPayload): void {
  emitDomainEvent(
    stamp({
      type: 'test.scheduled',
      idempotency_key: `test:${payload.test_id}:scheduled`,
      payload,
    }),
  );
}
