# Reusable Timer

Mobile path: `apps/mobile/src/components/ui/timer/`

Used by the Test Screen; reusable anywhere that needs a countdown.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│ Timer (UI chip)                             │
│  · formatted MM:SS / H:MM:SS                │
│  · warning / expired styles                 │
│  · "Paused" badge when backgrounded         │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ useCountdownTimer (engine)                  │
│  remainingMs  ← source of truth when paused │
│  AppState     ← pause / resume              │
│  onLowTimeWarning (once)                    │
│  onAutoSubmit (once at 0)                   │
│  onPauseCredit(pausedMs) → API              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ TestScreen / any parent                     │
│  creditAttemptPause → ends_at += paused_ms  │
│  flush answers + submitAttempt('auto')      │
└─────────────────────────────────────────────┘
```

### Why remainingMs + pause credit?

Freezing only on the client would desync server `ends_at` (saves would expire mid-pause). On resume the Timer reports `pausedMs`; the parent credits the server so expiry and auto-save stay aligned with the visible countdown.

---

## Behaviors

| Feature | Behavior |
|---------|----------|
| **Countdown** | Drains `remainingMs` every ~250ms while active |
| **Pause in background** | `AppState` inactive/background freezes ticks; shows Paused |
| **Low time warning** | Once when remaining ≤ `warningThresholdSeconds` (default 300) |
| **Auto submit** | Once at 0 → `onAutoSubmit` (Test Screen saves + `POST …/submit`) |

Set `pauseInBackground={false}` for strict wall-clock (no freeze).

---

## Usage

```tsx
import { Timer } from '@/components/ui/timer';

<Timer
  endsAt={attempt.ends_at}
  pauseInBackground
  warningThresholdSeconds={5 * 60}
  onLowTimeWarning={() => Alert.alert('Low time', '…')}
  onPauseCredit={(ms) => void creditAttemptPause(attemptId, ms)}
  onAutoSubmit={() => void autoSubmit()}
/>
```

Hook-only (custom UI):

```tsx
import { useCountdownTimer } from '@/components/ui/timer';

const { formatted, isWarning, isPaused } = useCountdownTimer({ endsAt, … });
```

---

## Related APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/student/attempts/:id/pause-credit` | `{ paused_ms }` → extend `ends_at` |
| `POST` | `/student/attempts/:id/submit` | `{ reason: "auto" \| "manual" }` lock attempt |

See also: [Test Screen](./test-screen.md).
