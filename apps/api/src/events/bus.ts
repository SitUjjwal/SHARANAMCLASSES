/**
 * In-process domain EventBus.
 *
 * Features emit after successful writes; subscribers (Notification Service, analytics, …)
 * react asynchronously. Failures in handlers never roll back the domain transaction.
 *
 * Future: swap publish() to outbox / Redis / SQS without changing emit call sites.
 */
import type { DomainEvent, DomainEventName } from '@sharanam/shared';

type Handler<E extends DomainEvent = DomainEvent> = (event: E) => void | Promise<void>;

class DomainEventBus {
  private readonly handlers = new Map<DomainEventName, Set<Handler>>();

  on<T extends DomainEventName>(
    type: T,
    handler: Handler<Extract<DomainEvent, { type: T }>>,
  ): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as Handler);
    this.handlers.set(type, set);
    return () => {
      set.delete(handler as Handler);
    };
  }

  /**
   * Publish to all subscribers. Settles all handlers; logs rejections.
   */
  async publish(event: DomainEvent): Promise<void> {
    const set = this.handlers.get(event.type);
    if (!set || set.size === 0) {
      return;
    }

    const results = await Promise.allSettled(
      [...set].map(async (handler) => handler(event)),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(
          `[events] handler failed for ${event.type}`,
          result.reason instanceof Error ? result.reason.message : result.reason,
        );
      }
    }
  }
}

export const domainEventBus = new DomainEventBus();

/**
 * Fire-and-forget emit — domain flows must not await push delivery.
 */
export function emitDomainEvent(event: DomainEvent): void {
  void domainEventBus.publish(event).catch((err) => {
    console.error(
      `[events] publish failed for ${event.type}`,
      err instanceof Error ? err.message : err,
    );
  });
}
