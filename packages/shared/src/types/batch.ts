/**
 * Batch → Subject → Chapter architecture types.
 *
 * A "Batch" is a sellable course container (backed by the `courses` table),
 * e.g. "Class 10 Bihar Board Batch 2026-27". Subjects live in a master
 * catalog (`subjects`) and attach to batches via `batch_subjects`.
 */
import type { CourseSummary } from './course';

export type SubjectStatus = 'active' | 'inactive';

/** Master subject catalog row (`subjects`). */
export type Subject = {
  id: string;
  name: string;
  code: string | null;
  description: string;
  icon_url: string | null;
  thumbnail_url: string | null;
  status: SubjectStatus;
  created_at: string;
  updated_at: string;
};

/** Batch ↔ subject link (`batch_subjects`) with joined subject + teacher. */
export type BatchSubject = {
  id: string;
  batch_id: string;
  subject_id: string;
  teacher_id: string | null;
  teacher_name: string | null;
  sort_order: number;
  status: SubjectStatus;
  subject: Subject;
  /** Content counts inside this batch subject */
  chapter_count: number;
  video_count: number;
  pdf_count: number;
  notes_count: number;
  test_count: number;
};

/**
 * Batch summary = course summary + batch pricing/window fields + subject count.
 * `courses` remains the storage table; these extra columns were added by the
 * batch architecture migration.
 */
export type BatchSummary = CourseSummary & {
  original_price: number | null;
  discount_percent: number | null;
  start_date: string | null;
  end_date: string | null;
  subject_count: number;
  student_count?: number;
};

export type BatchDetail = BatchSummary & {
  subjects: BatchSubject[];
};

/** Student-facing subject tile inside a purchased batch. */
export type StudentBatchSubject = {
  id: string;
  batch_id: string;
  subject_id: string;
  name: string;
  code: string | null;
  icon_url: string | null;
  thumbnail_url: string | null;
  teacher_name: string | null;
  sort_order: number;
  chapter_count: number;
  video_count: number;
  pdf_count: number;
  notes_count: number;
  test_count: number;
  /** 0–100 based on watched videos in this subject (0 when unknown) */
  progress_percent: number;
};
