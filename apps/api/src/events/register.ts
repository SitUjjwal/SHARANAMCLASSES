/**
 * Boot-time registration for domain event subscribers.
 */
import { registerNotificationEventHandlers } from './handlers/notification.handlers';

let registered = false;

export function registerDomainEventHandlers(): void {
  if (registered) return;
  registerNotificationEventHandlers();
  registered = true;
}
