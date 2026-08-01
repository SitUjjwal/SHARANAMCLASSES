/**
 * useAutoSaveAnswers — debounce local answer map → PUT /attempts/:id/answers.
 *
 * Saves ~800ms after the last change, and flush() for immediate persist
 * (e.g. leave screen / jump question).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  mapToPayload,
  type AnswerMap,
} from '@/modules/tests/utils/answers';
import { saveAttemptAnswers } from '@/services/test.service';

const DEBOUNCE_MS = 800;

type Options = {
  attemptId: string;
  questionIds: string[];
  answers: AnswerMap;
  currentIndex: number;
  enabled: boolean;
};

export function useAutoSaveAnswers({
  attemptId,
  questionIds,
  answers,
  currentIndex,
  enabled,
}: Options) {
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ answers, currentIndex, questionIds });
  const skipFirst = useRef(true);

  latestRef.current = { answers, currentIndex, questionIds };

  const flush = useCallback(async () => {
    if (!enabled || !attemptId) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const snap = latestRef.current;
    setSaveState('saving');
    setErrorMessage(null);
    try {
      await saveAttemptAnswers(attemptId, {
        current_question_index: snap.currentIndex,
        answers: mapToPayload(snap.answers, snap.questionIds),
      });
      setSaveState('saved');
    } catch (err) {
      setSaveState('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not save answers',
      );
    }
  }, [attemptId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [answers, currentIndex, enabled, flush]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveState, errorMessage, flush };
}
