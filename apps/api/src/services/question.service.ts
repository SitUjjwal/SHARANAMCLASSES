/**
 * question.service.ts — Question Management for Test Series.
 *
 * CRUD + Excel bulk import. Correct answers stay admin-only until attempts module.
 */
import ExcelJS from 'exceljs';
import type {
  Question,
  QuestionBulkImportResult,
  QuestionCorrectAnswer,
  QuestionPublic,
} from '@sharanam/shared';

import { getSupabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/AppError';
import {
  bulkQuestionRowSchema,
  type CreateQuestionInput,
  type ListQuestionsQuery,
  type UpdateQuestionInput,
} from '../validators/question.validators';

const QUESTION_COLUMNS =
  'id, test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, marks, negative_marks, sort_order, created_at, updated_at';

export type QuestionListPage = {
  items: Question[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

type QuestionRow = {
  id: string;
  test_id: string;
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
  created_at: string;
  updated_at: string;
};

function toQuestion(row: QuestionRow, testTitle?: string | null): Question {
  return {
    ...row,
    marks: Number(row.marks),
    negative_marks: Number(row.negative_marks),
    test_title: testTitle ?? null,
  };
}

export async function assertTestExists(testId: string): Promise<{ id: string; title: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('tests')
    .select('id, title')
    .eq('id', testId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'TEST_LOOKUP_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'TEST_NOT_FOUND', 'Test not found');
  }
  return { id: data.id as string, title: data.title as string };
}

function assertMarks(marks: number, negativeMarks: number): void {
  if (negativeMarks > marks) {
    throw new AppError(
      400,
      'INVALID_NEGATIVE_MARKS',
      'Negative marks cannot exceed question marks',
    );
  }
}

export async function listQuestionsForAdmin(
  query: ListQuestionsQuery,
): Promise<QuestionListPage> {
  await assertTestExists(query.testId);

  const supabase = getSupabaseAdmin();
  const page = query.page;
  const pageSize = query.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dbQuery = supabase
    .from('questions')
    .select(QUESTION_COLUMNS, { count: 'exact' })
    .eq('test_id', query.testId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, to);

  const search = query.search?.trim();
  if (search) {
    const safe = search.replace(/[%_,.()]/g, '');
    if (safe) {
      dbQuery = dbQuery.or(
        `question_text.ilike.%${safe}%,option_a.ilike.%${safe}%,option_b.ilike.%${safe}%,option_c.ilike.%${safe}%,option_d.ilike.%${safe}%,explanation.ilike.%${safe}%`,
      );
    }
  }

  const { data, error, count } = await dbQuery;
  if (error) {
    throw new AppError(500, 'QUESTIONS_FETCH_FAILED', error.message);
  }

  const items = ((data ?? []) as QuestionRow[]).map((row) => toQuestion(row));
  const total = count ?? items.length;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore: from + items.length < total,
  };
}

export async function getQuestionForAdmin(questionId: string): Promise<Question> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .select(QUESTION_COLUMNS)
    .eq('id', questionId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, 'QUESTION_FETCH_FAILED', error.message);
  }
  if (!data) {
    throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
  }

  const row = data as QuestionRow;
  const test = await assertTestExists(row.test_id);
  return toQuestion(row, test.title);
}

export async function createQuestion(input: CreateQuestionInput): Promise<Question> {
  const test = await assertTestExists(input.test_id);
  assertMarks(input.marks, input.negative_marks);

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('questions')
    .insert({
      test_id: input.test_id,
      question_text: input.question_text,
      option_a: input.option_a,
      option_b: input.option_b,
      option_c: input.option_c,
      option_d: input.option_d,
      correct_answer: input.correct_answer,
      explanation: input.explanation ?? '',
      marks: input.marks,
      negative_marks: input.negative_marks ?? 0,
      sort_order: input.sort_order ?? 0,
      updated_at: now,
    })
    .select(QUESTION_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'QUESTION_CREATE_FAILED', error.message);
  }

  return toQuestion(data as QuestionRow, test.title);
}

export async function updateQuestion(
  questionId: string,
  input: UpdateQuestionInput,
): Promise<Question> {
  const existing = await getQuestionForAdmin(questionId);
  const marks = input.marks ?? existing.marks;
  const negative = input.negative_marks ?? existing.negative_marks;
  assertMarks(marks, negative);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.question_text !== undefined) patch.question_text = input.question_text;
  if (input.option_a !== undefined) patch.option_a = input.option_a;
  if (input.option_b !== undefined) patch.option_b = input.option_b;
  if (input.option_c !== undefined) patch.option_c = input.option_c;
  if (input.option_d !== undefined) patch.option_d = input.option_d;
  if (input.correct_answer !== undefined) patch.correct_answer = input.correct_answer;
  if (input.explanation !== undefined) patch.explanation = input.explanation;
  if (input.marks !== undefined) patch.marks = input.marks;
  if (input.negative_marks !== undefined) patch.negative_marks = input.negative_marks;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .update(patch)
    .eq('id', questionId)
    .select(QUESTION_COLUMNS)
    .single();

  if (error) {
    throw new AppError(400, 'QUESTION_UPDATE_FAILED', error.message);
  }

  return toQuestion(data as QuestionRow, existing.test_title);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from('questions')
    .select('id')
    .eq('id', questionId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError(500, 'QUESTION_FETCH_FAILED', fetchError.message);
  }
  if (!existing) {
    throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
  }

  const { error } = await supabase.from('questions').delete().eq('id', questionId);
  if (error) {
    throw new AppError(400, 'QUESTION_DELETE_FAILED', error.message);
  }
}

function cellToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String((value as { text: unknown }).text ?? '').trim();
  }
  return String(value).trim();
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const HEADER_ALIASES: Record<string, string> = {
  question: 'question_text',
  question_text: 'question_text',
  questiontext: 'question_text',
  option_a: 'option_a',
  optiona: 'option_a',
  a: 'option_a',
  option_b: 'option_b',
  optionb: 'option_b',
  b: 'option_b',
  option_c: 'option_c',
  optionc: 'option_c',
  c: 'option_c',
  option_d: 'option_d',
  optiond: 'option_d',
  d: 'option_d',
  correct_answer: 'correct_answer',
  correctanswer: 'correct_answer',
  answer: 'correct_answer',
  explanation: 'explanation',
  marks: 'marks',
  mark: 'marks',
  negative_marks: 'negative_marks',
  negativemarks: 'negative_marks',
  negative: 'negative_marks',
  sort_order: 'sort_order',
  order: 'sort_order',
};

/**
 * Parse .xlsx / .xls buffer into row objects keyed by canonical field names.
 */
export async function parseQuestionsExcel(
  buffer: Buffer,
): Promise<Array<Record<string, string>>> {
  const workbook = new ExcelJS.Workbook();
  // exceljs accepts Buffer in Node
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new AppError(400, 'EXCEL_EMPTY', 'Excel file has no sheets');
  }

  const headerRow = sheet.getRow(1);
  const columnMap = new Map<number, string>();

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(cellToString(cell.value));
    const canonical = HEADER_ALIASES[key];
    if (canonical) {
      columnMap.set(colNumber, canonical);
    }
  });

  const required = [
    'question_text',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
  ];
  const present = new Set(columnMap.values());
  for (const field of required) {
    if (!present.has(field)) {
      throw new AppError(
        400,
        'EXCEL_HEADERS_INVALID',
        `Missing required column: ${field}. Expected headers: question_text, option_a–d, correct_answer, explanation, marks, negative_marks`,
      );
    }
  }

  const rows: Array<Record<string, string>> = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    let any = false;
    columnMap.forEach((field, col) => {
      const value = cellToString(row.getCell(col).value);
      if (value) any = true;
      obj[field] = value;
    });
    if (any) rows.push(obj);
  });

  return rows;
}

export async function bulkImportQuestions(
  testId: string,
  rows: Array<Record<string, string>>,
): Promise<QuestionBulkImportResult> {
  await assertTestExists(testId);

  const result: QuestionBulkImportResult = {
    imported: 0,
    skipped: 0,
    errors: [],
  };

  // Resolve next sort_order base
  const supabase = getSupabaseAdmin();
  const { data: last } = await supabase
    .from('questions')
    .select('sort_order')
    .eq('test_id', testId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextOrder = Number(last?.sort_order ?? -1) + 1;

  for (let i = 0; i < rows.length; i += 1) {
    const excelRow = i + 2; // 1-based + header
    const parsed = bulkQuestionRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Invalid row';
      result.skipped += 1;
      result.errors.push({ row: excelRow, message: msg });
      continue;
    }

    const body = parsed.data;
    if (body.negative_marks > body.marks) {
      result.skipped += 1;
      result.errors.push({
        row: excelRow,
        message: 'Negative marks cannot exceed question marks',
      });
      continue;
    }

    const sort_order = body.sort_order ?? nextOrder;
    nextOrder = Math.max(nextOrder, sort_order + 1);

    try {
      await createQuestion({
        test_id: testId,
        question_text: body.question_text,
        option_a: body.option_a,
        option_b: body.option_b,
        option_c: body.option_c,
        option_d: body.option_d,
        correct_answer: body.correct_answer,
        explanation: body.explanation,
        marks: body.marks,
        negative_marks: body.negative_marks,
        sort_order,
      });
      result.imported += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push({
        row: excelRow,
        message: err instanceof AppError ? err.message : 'Insert failed',
      });
    }
  }

  return result;
}

/** Student attempt list — no correct_answer / explanation */
export async function listQuestionsPublic(testId: string): Promise<QuestionPublic[]> {
  await assertTestExists(testId);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .select(
      'id, test_id, question_text, option_a, option_b, option_c, option_d, marks, negative_marks, sort_order',
    )
    .eq('test_id', testId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new AppError(500, 'QUESTIONS_FETCH_FAILED', error.message);
  }

  return ((data ?? []) as QuestionPublic[]).map((row) => ({
    ...row,
    marks: Number(row.marks),
    negative_marks: Number(row.negative_marks),
  }));
}
