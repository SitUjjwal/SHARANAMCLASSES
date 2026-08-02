/**
 * Domain events — features emit; Notification Service (and others) subscribe.
 * Keep payloads JSON-serializable for a future outbox / queue.
 */
export type DomainEventName =
  | 'payment.completed'
  | 'course.updated'
  | 'chapter.published'
  | 'live_class.scheduled'
  | 'test.scheduled';

export type DomainEventBase<TName extends DomainEventName, TPayload> = {
  type: TName;
  /** ISO timestamp when the domain write succeeded */
  occurred_at: string;
  /** Optional idempotency key for subscribers (e.g. payment order id) */
  idempotency_key?: string;
  payload: TPayload;
};

export type PaymentCompletedPayload = {
  user_id: string;
  payment_order_id: string;
  razorpay_payment_id: string;
  product_id: string | null;
  product_type: string | null;
  product_title: string;
  course_id: string | null;
  amount_paise: number;
  currency: string;
  enrolled: boolean;
};

export type CourseUpdatedPayload = {
  course_id: string;
  title: string;
  is_published: boolean;
  /** Previous publish flag when known (publish-flip detection) */
  previous_is_published: boolean | null;
  updated_fields: string[];
};

export type ChapterPublishedPayload = {
  chapter_id: string;
  course_id: string;
  title: string;
  course_title: string;
};

export type LiveClassScheduledPayload = {
  live_class_id: string;
  course_id: string | null;
  title: string;
  start_time: string;
};

export type TestScheduledPayload = {
  test_id: string;
  course_id: string | null;
  title: string;
  scheduled_at: string;
};

export type PaymentCompletedEvent = DomainEventBase<
  'payment.completed',
  PaymentCompletedPayload
>;
export type CourseUpdatedEvent = DomainEventBase<'course.updated', CourseUpdatedPayload>;
export type ChapterPublishedEvent = DomainEventBase<
  'chapter.published',
  ChapterPublishedPayload
>;
export type LiveClassScheduledEvent = DomainEventBase<
  'live_class.scheduled',
  LiveClassScheduledPayload
>;
export type TestScheduledEvent = DomainEventBase<'test.scheduled', TestScheduledPayload>;

export type DomainEvent =
  | PaymentCompletedEvent
  | CourseUpdatedEvent
  | ChapterPublishedEvent
  | LiveClassScheduledEvent
  | TestScheduledEvent;
