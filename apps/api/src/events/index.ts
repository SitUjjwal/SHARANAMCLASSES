/**
 * Domain events public API for feature services.
 * Intentionally does NOT export register — that pulls notification handlers
 * and would create circular loads when services import emit helpers.
 */
export { domainEventBus, emitDomainEvent } from './bus';
export {
  emitChapterPublished,
  emitCourseUpdated,
  emitLiveClassScheduled,
  emitPaymentCompleted,
  emitTestScheduled,
} from './emit';
