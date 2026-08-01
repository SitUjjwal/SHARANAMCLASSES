/**
 * Local answer map helpers for the Test Screen.
 */
import type {
  QuestionCorrectAnswer,
  QuestionPublic,
  TestAttemptAnswerState,
} from '@sharanam/shared';

export type AnswerDraft = {
  selected_answer: QuestionCorrectAnswer | null;
  is_marked_for_review: boolean;
};

export type AnswerMap = Record<string, AnswerDraft>;

export function answersToMap(answers: TestAttemptAnswerState[]): AnswerMap {
  const map: AnswerMap = {};
  for (const row of answers) {
    map[row.question_id] = {
      selected_answer: row.selected_answer,
      is_marked_for_review: row.is_marked_for_review,
    };
  }
  return map;
}

export function ensureAnswerSlots(
  questions: QuestionPublic[],
  map: AnswerMap,
): AnswerMap {
  const next = { ...map };
  for (const q of questions) {
    if (!next[q.id]) {
      next[q.id] = { selected_answer: null, is_marked_for_review: false };
    }
  }
  return next;
}

export function mapToPayload(
  map: AnswerMap,
  questionIds: string[],
): TestAttemptAnswerState[] {
  return questionIds.map((question_id) => {
    const draft = map[question_id] ?? {
      selected_answer: null,
      is_marked_for_review: false,
    };
    return {
      question_id,
      selected_answer: draft.selected_answer,
      is_marked_for_review: draft.is_marked_for_review,
    };
  });
}

export function countAnswered(map: AnswerMap, questionIds: string[]): number {
  return questionIds.filter((id) => map[id]?.selected_answer != null).length;
}

/** @deprecated Prefer formatCountdown from @/components/ui/timer */
export { formatCountdown as formatTimer } from '@/components/ui/timer';
