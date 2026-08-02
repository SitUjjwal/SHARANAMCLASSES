/**
 * attempt.service.ts — start / resume / auto-save / score student test attempts.
 */
import type {
  QuestionCorrectAnswer,
  QuestionPublic,
  TestAnswerOutcome,
  TestAttempt,
  TestAttemptAnswerState,
  TestAttemptResult,
  TestAttemptResultListPage,
  TestAttemptResultSummary,
  TestAttemptReviewItem,
  TestAttemptSession,
  TestAttemptStatus,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { userHasCourseAccess } from './courseAccess.service';
import { listQuestionsPublic } from './question.service';
import { AppError } from '../utils/AppError';
import type {
  ListResultsQuery,
  SaveAttemptAnswersInput,
} from '../validators/attempt.validators';

type AttemptRow = {
  id: string;
  user_id: string;
  test_id: string;
  status: TestAttemptStatus;
  started_at: string;
  ends_at: string;
  submitted_at: string | null;
  current_question_index: number;
  obtained_marks?: number | null;
  correct_count?: number | null;
  wrong_count?: number | null;
  skipped_count?: number | null;
  percentage?: number | null;
  is_passed?: boolean | null;
};

type AnswerRow = {
  question_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D' | null;
  is_marked_for_review: boolean;
};

type QuestionKeyRow = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: QuestionCorrectAnswer;
  explanation: string;
  marks: number;
  negative_marks: number;
  sort_order: number;
};

type PublishedTestMeta = {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_free: boolean;
  is_published: boolean;
  course_id: string | null;
};

async function loadPublishedTest(testId: string): Promise<PublishedTestMeta> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tests')
    .select(
      'id, title, duration_minutes, total_marks, passing_marks, is_free, is_published, course_id',
    )
    .eq('id', testId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'TEST_LOOKUP_FAILED', error.message);
  }
  if (!data || !data.is_published) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Test not found');
  }

  return {
    id: data.id as string,
    title: data.title as string,
    duration_minutes: Number(data.duration_minutes),
    total_marks: Number(data.total_marks),
    passing_marks: Number(data.passing_marks),
    is_free: Boolean(data.is_free),
    is_published: Boolean(data.is_published),
    course_id: (data.course_id as string | null) ?? null,
  };
}

async function assertCanTakeTest(userId: string, test: PublishedTestMeta): Promise<void> {
  if (test.is_free || !test.course_id) return;
  const hasAccess = await userHasCourseAccess(userId, test.course_id);
  if (!hasAccess) {
    throw new AppError(
      403,
      'TEST_LOCKED',
      'Purchase or enroll in the course to take this test',
    );
  }
}

function toAttempt(
  row: AttemptRow,
  test: Pick<PublishedTestMeta, 'title' | 'duration_minutes' | 'total_marks'>,
): TestAttempt {
  return {
    id: row.id,
    test_id: row.test_id,
    status: row.status,
    started_at: row.started_at,
    ends_at: row.ends_at,
    submitted_at: row.submitted_at,
    current_question_index: row.current_question_index,
    duration_minutes: test.duration_minutes,
    test_title: test.title,
    total_marks: test.total_marks,
  };
}

async function loadAnswers(attemptId: string): Promise<TestAttemptAnswerState[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempt_answers')
    .select('question_id, selected_answer, is_marked_for_review')
    .eq('attempt_id', attemptId);

  if (error) {
    throw new AppError(500, 'ATTEMPT_ANSWERS_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as AnswerRow[]).map((row) => ({
    question_id: row.question_id,
    selected_answer: row.selected_answer,
    is_marked_for_review: Boolean(row.is_marked_for_review),
  }));
}

async function buildSession(
  row: AttemptRow,
  test: PublishedTestMeta,
  questions?: QuestionPublic[],
): Promise<TestAttemptSession> {
  const [answers, questionList] = await Promise.all([
    loadAnswers(row.id),
    questions ? Promise.resolve(questions) : listQuestionsPublic(test.id),
  ]);

  return {
    attempt: toAttempt(row, test),
    questions: questionList,
    answers,
  };
}

/**
 * Mark in_progress → expired when wall clock passed ends_at.
 * Returns the (possibly updated) row.
 */
async function refreshExpiry(row: AttemptRow): Promise<AttemptRow> {
  if (row.status !== 'in_progress') return row;
  if (Date.parse(row.ends_at) > Date.now()) return row;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .update({
      status: 'expired',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)
    .eq('status', 'in_progress')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_EXPIRE_FAILED', error.message);
  }
  return (data as AttemptRow | null) ?? { ...row, status: 'expired' };
}

/** POST /student/tests/:testId/attempts — start new or resume in_progress */
export async function startOrResumeAttempt(
  userId: string,
  testId: string,
): Promise<TestAttemptSession> {
  const test = await loadPublishedTest(testId);
  await assertCanTakeTest(userId, test);

  const questions = await listQuestionsPublic(testId);
  if (questions.length === 0) {
    throw new AppError(400, 'TEST_EMPTY', 'This test has no questions yet');
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .eq('user_id', userId)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (existingError) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', existingError.message);
  }

  if (existing) {
    const refreshed = await refreshExpiry(existing as AttemptRow);
    if (refreshed.status === 'in_progress') {
      return buildSession(refreshed, test, questions);
    }
  }

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + test.duration_minutes * 60_000);

  const { data: created, error: createError } = await supabase
    .from('test_attempts')
    .insert({
      user_id: userId,
      test_id: testId,
      status: 'in_progress',
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      current_question_index: 0,
    })
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .single();

  if (createError || !created) {
    throw new AppError(
      500,
      'ATTEMPT_CREATE_FAILED',
      createError?.message ?? 'Could not start attempt',
    );
  }

  // Seed empty answer rows so auto-save is upsert-friendly
  const seed = questions.map((q) => ({
    attempt_id: (created as AttemptRow).id,
    question_id: q.id,
    selected_answer: null,
    is_marked_for_review: false,
  }));

  if (seed.length > 0) {
    const { error: seedError } = await supabase
      .from('test_attempt_answers')
      .upsert(seed, { onConflict: 'attempt_id,question_id' });
    if (seedError) {
      throw new AppError(500, 'ATTEMPT_SEED_FAILED', seedError.message);
    }
  }

  return buildSession(created as AttemptRow, test, questions);
}

/** GET /student/attempts/:attemptId */
export async function getAttemptSession(
  userId: string,
  attemptId: string,
): Promise<TestAttemptSession> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }

  const refreshed = await refreshExpiry(data as AttemptRow);
  const test = await loadPublishedTest(refreshed.test_id);
  return buildSession(refreshed, test);
}

/** PUT /student/attempts/:attemptId/answers — debounced auto-save from mobile */
export async function saveAttemptAnswers(
  userId: string,
  attemptId: string,
  input: SaveAttemptAnswersInput,
): Promise<TestAttemptSession> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }

  let row = await refreshExpiry(data as AttemptRow);
  if (row.status !== 'in_progress') {
    throw new AppError(
      409,
      'ATTEMPT_NOT_ACTIVE',
      'This attempt is no longer in progress',
    );
  }

  const test = await loadPublishedTest(row.test_id);
  const questions = await listQuestionsPublic(test.id);
  const allowedIds = new Set(questions.map((q) => q.id));

  for (const answer of input.answers) {
    if (!allowedIds.has(answer.question_id)) {
      throw new AppError(
        400,
        'INVALID_QUESTION',
        `Question ${answer.question_id} does not belong to this test`,
      );
    }
  }

  if (input.answers.length > 0) {
    const upserts = input.answers.map((answer) => ({
      attempt_id: attemptId,
      question_id: answer.question_id,
      selected_answer: answer.selected_answer,
      is_marked_for_review: answer.is_marked_for_review ?? false,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from('test_attempt_answers')
      .upsert(upserts, { onConflict: 'attempt_id,question_id' });

    if (upsertError) {
      throw new AppError(500, 'ATTEMPT_SAVE_FAILED', upsertError.message);
    }
  }

  const nextIndex =
    typeof input.current_question_index === 'number'
      ? Math.min(input.current_question_index, Math.max(0, questions.length - 1))
      : row.current_question_index;

  const { data: updated, error: updateError } = await supabase
    .from('test_attempts')
    .update({
      current_question_index: nextIndex,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('status', 'in_progress')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .maybeSingle();

  if (updateError) {
    throw new AppError(500, 'ATTEMPT_SAVE_FAILED', updateError.message);
  }
  if (updated) {
    row = updated as AttemptRow;
  }

  return buildSession(row, test, questions);
}

/**
 * POST /student/attempts/:attemptId/pause-credit
 * Extend ends_at by paused_ms so background pause stays server-synced.
 */
export async function creditAttemptPause(
  userId: string,
  attemptId: string,
  pausedMs: number,
): Promise<TestAttempt> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }

  const row = data as AttemptRow;
  if (row.status !== 'in_progress') {
    throw new AppError(
      409,
      'ATTEMPT_NOT_ACTIVE',
      'This attempt is no longer in progress',
    );
  }

  const test = await loadPublishedTest(row.test_id);
  const nextEnds = new Date(Date.parse(row.ends_at) + pausedMs).toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('test_attempts')
    .update({
      ends_at: nextEnds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('status', 'in_progress')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index',
    )
    .maybeSingle();

  if (updateError || !updated) {
    throw new AppError(
      500,
      'ATTEMPT_PAUSE_CREDIT_FAILED',
      updateError?.message ?? 'Could not extend timer',
    );
  }

  return toAttempt(updated as AttemptRow, test);
}

/**
 * POST /student/attempts/:attemptId/submit
 * Lock attempt, score answers, return Result Screen payload.
 */
export async function submitAttempt(
  userId: string,
  attemptId: string,
  reason: 'manual' | 'auto' = 'manual',
): Promise<TestAttemptResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
    )
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }

  let row = data as AttemptRow;
  if (row.status === 'in_progress') {
    const pastDeadline = Date.parse(row.ends_at) <= Date.now();
    const nextStatus =
      reason === 'auto' || pastDeadline ? 'expired' : 'submitted';
    const scored = await scoreAttempt(row.test_id, attemptId);

    const { data: updated, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        status: nextStatus,
        submitted_at: new Date().toISOString(),
        obtained_marks: scored.obtained_marks,
        correct_count: scored.correct_count,
        wrong_count: scored.wrong_count,
        skipped_count: scored.skipped_count,
        percentage: scored.percentage,
        is_passed: scored.is_passed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .eq('status', 'in_progress')
      .select(
        'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
      )
      .maybeSingle();

    if (updateError) {
      throw new AppError(500, 'ATTEMPT_SUBMIT_FAILED', updateError.message);
    }
    if (updated) {
      row = updated as AttemptRow;
    }
  }

  return buildResult(row);
}

/** GET /student/attempts/:attemptId/result */
export async function getAttemptResult(
  userId: string,
  attemptId: string,
): Promise<TestAttemptResult> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
    )
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'ATTEMPT_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found');
  }

  const row = data as AttemptRow;
  if (row.status === 'in_progress') {
    throw new AppError(
      409,
      'ATTEMPT_STILL_ACTIVE',
      'Submit the attempt before viewing results',
    );
  }

  // Backfill score if an older attempt was locked without scoring
  if (row.obtained_marks == null) {
    const scored = await scoreAttempt(row.test_id, attemptId);
    const { data: updated, error: updateError } = await supabase
      .from('test_attempts')
      .update({
        obtained_marks: scored.obtained_marks,
        correct_count: scored.correct_count,
        wrong_count: scored.wrong_count,
        skipped_count: scored.skipped_count,
        percentage: scored.percentage,
        is_passed: scored.is_passed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select(
        'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
      )
      .maybeSingle();

    if (updateError || !updated) {
      throw new AppError(
        500,
        'ATTEMPT_SCORE_FAILED',
        updateError?.message ?? 'Could not score attempt',
      );
    }
    return buildResult(updated as AttemptRow);
  }

  return buildResult(row);
}

async function loadQuestionsWithKeys(testId: string): Promise<QuestionKeyRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .select(
      'id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, negative_marks, sort_order',
    )
    .eq('test_id', testId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'QUESTIONS_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as QuestionKeyRow[]).map((row) => ({
    ...row,
    marks: Number(row.marks),
    negative_marks: Number(row.negative_marks),
  }));
}

type ScoreBundle = {
  obtained_marks: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  percentage: number;
  is_passed: boolean;
  review: TestAttemptReviewItem[];
};

async function scoreAttempt(testId: string, attemptId: string): Promise<ScoreBundle> {
  const test = await loadPublishedTest(testId);
  const [questions, answers] = await Promise.all([
    loadQuestionsWithKeys(testId),
    loadAnswers(attemptId),
  ]);

  const answerMap = new Map(answers.map((a) => [a.question_id, a]));
  let obtained = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const review: TestAttemptReviewItem[] = [];

  for (const q of questions) {
    const selected = answerMap.get(q.id)?.selected_answer ?? null;
    let outcome: TestAnswerOutcome;
    if (selected == null) {
      outcome = 'skipped';
      skipped += 1;
    } else if (selected === q.correct_answer) {
      outcome = 'correct';
      correct += 1;
      obtained += q.marks;
    } else {
      outcome = 'wrong';
      wrong += 1;
      obtained -= q.negative_marks;
    }

    review.push({
      question_id: q.id,
      sort_order: q.sort_order,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      selected_answer: selected,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? '',
      marks: q.marks,
      negative_marks: q.negative_marks,
      outcome,
    });
  }

  const percentageRaw =
    test.total_marks > 0 ? (obtained / test.total_marks) * 100 : 0;
  const percentage = Math.round(Math.min(100, Math.max(0, percentageRaw)) * 100) / 100;
  const obtained_marks = Math.round(obtained * 100) / 100;

  return {
    obtained_marks,
    correct_count: correct,
    wrong_count: wrong,
    skipped_count: skipped,
    percentage,
    is_passed: obtained_marks >= test.passing_marks,
    review,
  };
}

async function buildResult(row: AttemptRow): Promise<TestAttemptResult> {
  const test = await loadPublishedTest(row.test_id);
  const scored = await scoreAttempt(row.test_id, row.id);

  const summary: TestAttemptResultSummary = {
    attempt_id: row.id,
    test_id: row.test_id,
    test_title: test.title,
    status: row.status,
    total_marks: test.total_marks,
    passing_marks: test.passing_marks,
    obtained_marks:
      row.obtained_marks != null
        ? Number(row.obtained_marks)
        : scored.obtained_marks,
    correct_count:
      row.correct_count != null ? Number(row.correct_count) : scored.correct_count,
    wrong_count:
      row.wrong_count != null ? Number(row.wrong_count) : scored.wrong_count,
    skipped_count:
      row.skipped_count != null
        ? Number(row.skipped_count)
        : scored.skipped_count,
    percentage:
      row.percentage != null ? Number(row.percentage) : scored.percentage,
    is_passed: row.is_passed ?? scored.is_passed,
    submitted_at: row.submitted_at,
    rank: await computeAttemptRank(row.test_id, row.id, {
      percentage:
        row.percentage != null ? Number(row.percentage) : scored.percentage,
      obtained_marks:
        row.obtained_marks != null
          ? Number(row.obtained_marks)
          : scored.obtained_marks,
      started_at: row.started_at,
      submitted_at: row.submitted_at,
    }),
  };

  return { summary, review: scored.review };
}

type RankSeed = {
  percentage: number;
  obtained_marks: number;
  started_at: string;
  submitted_at: string | null;
};

function timeTakenSeconds(startedAt: string, submittedAt: string | null): number {
  if (!submittedAt) return Number.MAX_SAFE_INTEGER;
  const ms = Date.parse(submittedAt) - Date.parse(startedAt);
  if (!Number.isFinite(ms) || ms < 0) return Number.MAX_SAFE_INTEGER;
  return Math.round(ms / 1000);
}

function compareAttemptsForRank(
  a: RankSeed & { id: string },
  b: RankSeed & { id: string },
): number {
  if (a.percentage !== b.percentage) return b.percentage - a.percentage;
  if (a.obtained_marks !== b.obtained_marks) return b.obtained_marks - a.obtained_marks;
  return (
    timeTakenSeconds(a.started_at, a.submitted_at) -
    timeTakenSeconds(b.started_at, b.submitted_at)
  );
}

/**
 * Rank of one attempt within its test (same rules as leaderboard).
 */
async function computeAttemptRank(
  testId: string,
  attemptId: string,
  seed: RankSeed,
): Promise<number | null> {
  const ranks = await computeRanksForTest(testId, [
    { id: attemptId, ...seed },
  ]);
  return ranks.get(attemptId) ?? null;
}

async function computeRanksForTest(
  testId: string,
  needed: Array<RankSeed & { id: string }>,
): Promise<Map<string, number>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('test_attempts')
    .select('id, started_at, submitted_at, obtained_marks, percentage')
    .eq('test_id', testId)
    .in('status', ['submitted', 'expired'])
    .not('obtained_marks', 'is', null)
    .not('percentage', 'is', null)
    .limit(2000);

  if (error) {
    console.warn('[results] rank fetch failed', testId, error.message);
    return new Map();
  }

  const pool = (data ?? []).map((row) => ({
    id: row.id as string,
    percentage: Number(row.percentage) || 0,
    obtained_marks: Number(row.obtained_marks) || 0,
    started_at: row.started_at as string,
    submitted_at: (row.submitted_at as string | null) ?? null,
  }));

  // Ensure current attempt is present even if just submitted
  for (const n of needed) {
    if (!pool.some((p) => p.id === n.id)) {
      pool.push(n);
    }
  }

  pool.sort(compareAttemptsForRank);
  const ranks = new Map<string, number>();
  pool.forEach((row, index) => {
    ranks.set(row.id, index + 1);
  });
  return ranks;
}

/**
 * GET /results — paginated scored attempt summaries for the signed-in student.
 */
export async function listStudentResults(
  userId: string,
  query: ListResultsQuery,
): Promise<TestAttemptResultListPage> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from('test_attempts')
    .select(
      'id, user_id, test_id, status, started_at, ends_at, submitted_at, current_question_index, obtained_marks, correct_count, wrong_count, skipped_count, percentage, is_passed',
      { count: 'exact' },
    )
    .eq('user_id', userId)
    .in('status', ['submitted', 'expired'])
    .not('obtained_marks', 'is', null)
    .order('submitted_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(500, 'RESULTS_FETCH_FAILED', error.message);
  }

  const rows = (data ?? []) as AttemptRow[];
  const testIds = [...new Set(rows.map((r) => r.test_id))];
  const testMeta = new Map<
    string,
    { title: string; total_marks: number; passing_marks: number }
  >();

  if (testIds.length > 0) {
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('id, title, total_marks, passing_marks')
      .in('id', testIds);
    if (testsError) {
      throw new AppError(500, 'TESTS_FETCH_FAILED', testsError.message);
    }
    for (const t of tests ?? []) {
      testMeta.set(t.id as string, {
        title: t.title as string,
        total_marks: Number(t.total_marks),
        passing_marks: Number(t.passing_marks),
      });
    }
  }

  const ranksByAttempt = new Map<string, number>();
  await Promise.all(
    testIds.map(async (testId) => {
      const needed = rows
        .filter((r) => r.test_id === testId)
        .map((r) => ({
          id: r.id,
          percentage: Number(r.percentage ?? 0),
          obtained_marks: Number(r.obtained_marks ?? 0),
          started_at: r.started_at,
          submitted_at: r.submitted_at,
        }));
      const ranks = await computeRanksForTest(testId, needed);
      for (const [attemptId, rank] of ranks) {
        ranksByAttempt.set(attemptId, rank);
      }
    }),
  );

  const items: TestAttemptResultSummary[] = rows.map((row) => {
    const meta = testMeta.get(row.test_id);
    return {
      attempt_id: row.id,
      test_id: row.test_id,
      test_title: meta?.title ?? 'Test',
      status: row.status,
      total_marks: meta?.total_marks ?? 0,
      passing_marks: meta?.passing_marks ?? 0,
      obtained_marks: Number(row.obtained_marks ?? 0),
      correct_count: Number(row.correct_count ?? 0),
      wrong_count: Number(row.wrong_count ?? 0),
      skipped_count: Number(row.skipped_count ?? 0),
      percentage: Number(row.percentage ?? 0),
      is_passed: Boolean(row.is_passed),
      submitted_at: row.submitted_at,
      rank: ranksByAttempt.get(row.id) ?? null,
    };
  });

  const total = count ?? items.length;
  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}
