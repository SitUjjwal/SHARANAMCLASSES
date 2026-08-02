/**
 * Course / dashboard domain types shared by mobile, API, and admin.
 */
export type CourseClassLevel =
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | 'competitive'
  | 'computer';

export type CourseMedium = 'hindi' | 'english';

/** Class 11–12 stream (null for 9–10) */
export type CourseStream = 'science' | 'arts' | 'commerce';

export type CourseBoard = 'bihar_board' | 'other';

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type BannerRedirectType =
  | 'none'
  | 'course'
  | 'test'
  | 'live_class'
  | 'website';

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  redirect_url: string | null;
  redirect_type: BannerRedirectType;
  redirect_target_id: string | null;
  status: 'active' | 'inactive';
  sort_order: number;
};

export type CourseSummary = {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  /** Class / grade (maps to “class” in product language) */
  class_level: string | null;
  medium: CourseMedium | null;
  stream: CourseStream | null;
  board: CourseBoard | null;
  academic_year: string | null;
  subject: string | null;
  teacher_id: string | null;
  /** Usually mirrors medium (Hindi / English) */
  language: CourseMedium | null;
  teacher_name: string | null;
  /** List price in INR (final payable amount) */
  price: number;
  /**
   * Optional MRP / compare-at price in INR.
   * When greater than `price`, Buy Course shows Discount = compare_at − price.
   */
  compare_at_price?: number | null;
  /** Average rating 0–5 */
  rating: number;
  is_free: boolean;
  /** True when the current user has an enrollment (purchased / enrolled) */
  is_purchased: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
};

/** Paginated student course catalog */
export type CourseListPage = {
  items: CourseSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type CourseListFilters = {
  search?: string;
  categoryId?: string;
  featured?: boolean;
  classLevel?: string;
  medium?: CourseMedium;
  stream?: CourseStream;
  board?: CourseBoard;
  academicYear?: string;
  subject?: string;
  /** free | paid | all (omit / all = no price filter) */
  price?: 'free' | 'paid' | 'all';
  page?: number;
  pageSize?: number;
};

export type Chapter = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  /** 1-based display number in the course syllabus */
  chapter_number: number;
  duration_seconds: number;
  video_count: number;
  pdf_count: number;
  notes_count: number;
  /** True when user must purchase/enroll (unless free preview) */
  is_locked: boolean;
  video_url: string | null;
  is_free_preview: boolean;
  is_published: boolean;
};

export type ChapterContentType = 'video' | 'pdf' | 'note';

export type ChapterContentItem = {
  id: string;
  chapter_id: string;
  content_type: ChapterContentType;
  title: string;
  url: string | null;
  body: string | null;
  duration_seconds: number | null;
  sort_order: number;
};

export type VideoType = 'recorded' | 'live';

/** Admin / full video row (includes YouTube URL) */
export type Video = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  video_type: VideoType;
  thumbnail_url: string | null;
  duration_seconds: number;
  sort_order: number;
  is_free: boolean;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  /** Joined display helpers */
  course_title?: string | null;
  chapter_title?: string | null;
};

/**
 * Student-facing video — URL omitted when locked (paid + not enrolled).
 */
export type VideoPublic = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  video_type: VideoType;
  thumbnail_url: string | null;
  duration_seconds: number;
  sort_order: number;
  is_free: boolean;
  is_locked: boolean;
  youtube_url: string | null;
};

/** Admin / full PDF row (R2 URL + storage metadata) */
export type Pdf = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  file_url: string;
  storage_key: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  sort_order: number;
  is_free: boolean;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  course_title?: string | null;
  chapter_title?: string | null;
};

/**
 * Student-facing PDF — file_url omitted when locked (paid + not enrolled).
 */
export type PdfPublic = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  file_size: number;
  original_filename: string;
  sort_order: number;
  is_free: boolean;
  is_locked: boolean;
  file_url: string | null;
};

/** Admin / full note row (HTTPS URL only) */
export type Note = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  notes_url: string;
  sort_order: number;
  is_free: boolean;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  course_title?: string | null;
  chapter_title?: string | null;
};

/**
 * Student-facing note — notes_url omitted when locked (paid + not enrolled).
 */
export type NotePublic = {
  id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  sort_order: number;
  is_free: boolean;
  is_locked: boolean;
  notes_url: string | null;
};

/** Test Series catalog types (admin + student) */
export type TestType =
  | 'chapter_test'
  | 'subject_test'
  | 'mock_test'
  | 'previous_year'
  | 'daily_quiz';

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  chapter_test: 'Chapter Test',
  subject_test: 'Subject Test',
  mock_test: 'Mock Test',
  previous_year: 'Previous Year Test',
  daily_quiz: 'Daily Quiz',
};

/** Admin / full test row */
export type Test = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  test_type: TestType;
  course_id: string | null;
  chapter_id: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  sort_order: number;
  is_free: boolean;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  course_title?: string | null;
  chapter_title?: string | null;
};

/**
 * Student-facing test summary (unlock + catalog; attempts use TestAttemptSession).
 */
export type TestPublic = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  test_type: TestType;
  course_id: string | null;
  chapter_id: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  sort_order: number;
  is_free: boolean;
  is_locked: boolean;
  course_title?: string | null;
  chapter_title?: string | null;
};

/** Correct MCQ option key */
export type QuestionCorrectAnswer = 'A' | 'B' | 'C' | 'D';

/** Admin / full question row (includes correct answer) */
export type Question = {
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
  created_at?: string;
  updated_at?: string;
  test_title?: string | null;
};

/**
 * Student-facing question during an attempt — correct_answer / explanation omitted.
 */
export type QuestionPublic = {
  id: string;
  test_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  negative_marks: number;
  sort_order: number;
};

export type QuestionBulkImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

/** Lifecycle of a student test session */
export type TestAttemptStatus = 'in_progress' | 'submitted' | 'expired';

/** One answer row inside an attempt (client + API) */
export type TestAttemptAnswerState = {
  question_id: string;
  selected_answer: QuestionCorrectAnswer | null;
  is_marked_for_review: boolean;
};

/** Attempt metadata for the Test Screen header / timer */
export type TestAttempt = {
  id: string;
  test_id: string;
  status: TestAttemptStatus;
  started_at: string;
  ends_at: string;
  submitted_at: string | null;
  current_question_index: number;
  duration_minutes: number;
  test_title: string;
  total_marks: number;
};

/**
 * Full Test Screen payload — questions without keys + saved answers.
 */
export type TestAttemptSession = {
  attempt: TestAttempt;
  questions: QuestionPublic[];
  answers: TestAttemptAnswerState[];
};

/** Per-question outcome after scoring */
export type TestAnswerOutcome = 'correct' | 'wrong' | 'skipped';

/** Aggregate Result Screen summary */
export type TestAttemptResultSummary = {
  attempt_id: string;
  test_id: string;
  test_title: string;
  status: TestAttemptStatus;
  total_marks: number;
  passing_marks: number;
  obtained_marks: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string | null;
};

/** One row for Review Answers */
export type TestAttemptReviewItem = {
  question_id: string;
  sort_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_answer: QuestionCorrectAnswer | null;
  correct_answer: QuestionCorrectAnswer;
  explanation: string;
  marks: number;
  negative_marks: number;
  outcome: TestAnswerOutcome;
};

/** Full Result Screen payload */
export type TestAttemptResult = {
  summary: TestAttemptResultSummary;
  review: TestAttemptReviewItem[];
};

/** Paginated GET /results list */
export type TestAttemptResultListPage = {
  items: TestAttemptResultSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

/** One row on the Test Leaderboard (top 100) */
export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  student_name: string;
  score: number;
  percentage: number;
  time_taken_seconds: number;
  attempt_id: string;
  test_id: string;
  test_title: string;
  course_id: string | null;
  submitted_at: string;
};

/** Leaderboard list + active filters echo */
export type LeaderboardPage = {
  items: LeaderboardEntry[];
  total: number;
  limit: number;
  filters: {
    courseId: string | null;
    testId: string | null;
    date: string | null;
  };
};

/** Subject strength / weakness row */
export type AnalyticsSubjectStat = {
  subject: string;
  average_percentage: number;
  attempts: number;
  pass_percent: number;
};

/** Recent scored attempt for activity feed */
export type AnalyticsRecentActivity = {
  attempt_id: string;
  test_id: string;
  test_title: string;
  subject: string;
  percentage: number;
  obtained_marks: number;
  is_passed: boolean;
  submitted_at: string;
};

/** Chart series for analytics dashboard */
export type AnalyticsCharts = {
  /** Daily average percentage (ISO date YYYY-MM-DD) */
  score_over_time: Array<{
    date: string;
    average_percentage: number;
    attempts: number;
  }>;
  /** Per-subject average % for bar chart */
  by_subject: AnalyticsSubjectStat[];
};

/** Student Test Analytics Dashboard payload */
export type StudentTestAnalytics = {
  summary: {
    average_score: number;
    total_tests: number;
    total_attempts: number;
    pass_percentage: number;
  };
  strong_subjects: AnalyticsSubjectStat[];
  weak_subjects: AnalyticsSubjectStat[];
  recent_activity: AnalyticsRecentActivity[];
  charts: AnalyticsCharts;
};

/** Full chapter for content screen */
export type ChapterDetail = Chapter & {
  course_id: string;
  course_title: string;
  contents: ChapterContentItem[];
  /** Dedicated video catalog (preferred over legacy chapter_contents videos) */
  videos: VideoPublic[];
  /** Dedicated PDF catalog (preferred over legacy chapter_contents pdfs) */
  pdfs: PdfPublic[];
  /** Dedicated notes catalog (preferred over legacy chapter_contents notes) */
  notes: NotePublic[];
  /** Course-level live classes shown under this chapter syllabus */
  live_classes: LiveClassPublic[];
};

/** Admin / full live class row */
export type LiveClassStatus = 'upcoming' | 'live' | 'ended';

export type LiveClass = {
  id: string;
  course_id: string | null;
  title: string;
  description: string;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string | null;
  start_time: string;
  end_time: string;
  is_published: boolean;
  notification_sent_at: string | null;
  created_at?: string;
  updated_at?: string;
  course_title?: string | null;
  /** Derived from start/end vs now */
  status?: LiveClassStatus;
};

/** Student-facing live class */
export type LiveClassPublic = {
  id: string;
  course_id: string | null;
  course_title: string | null;
  teacher_name: string | null;
  title: string;
  description: string;
  thumbnail_url: string | null;
  start_time: string;
  end_time: string;
  status: LiveClassStatus;
  youtube_url: string | null;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  course?: CourseSummary | null;
};

/**
 * Owned / purchased course row for My Courses screen.
 * Sourced from enrollments (+ optional purchased_courses / last watched).
 */
export type MyCourseItem = {
  enrollment_id: string;
  course_id: string;
  title: string;
  teacher_name: string | null;
  thumbnail_url: string | null;
  progress_percent: number;
  enrolled_at: string;
  last_watched_at: string | null;
  last_watched_chapter_id: string | null;
  last_watched_chapter_title: string | null;
  is_free: boolean;
  /** True when a paid purchase row exists */
  is_purchased: boolean;
};

export type MyCoursesPage = {
  items: MyCourseItem[];
  /** Highest priority continue-learning target (most recent last_watched_at) */
  continue_learning: MyCourseItem | null;
};

/** Server-tracked Razorpay order lifecycle */
export type PaymentOrderStatus = 'created' | 'paid' | 'failed' | 'expired';

/** Sellable catalog types (extend as new catalogs ship) */
export type ProductType =
  | 'course'
  | 'test_series'
  | 'spoken_english'
  | 'ebook'
  | 'subscription';

/** Generic sellable SKU — orders reference `id`; `product_id` is the entity (e.g. courses.id) */
export type Product = {
  id: string;
  product_type: ProductType;
  product_id: string;
  title: string;
  price: number;
  currency: string;
  is_active: boolean;
};

export type PaymentOrder = {
  id: string;
  user_id: string;
  product_id: string | null;
  course_id: string | null;
  amount_paise: number;
  currency: string;
  status: PaymentOrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  receipt: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  course_title?: string | null;
  title?: string | null;
};

/** Payload returned to the client to open Razorpay Checkout */
export type CreatePaymentOrderResult = {
  order_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
  key_id: string;
  /** Catalog SKU (`products.id`) */
  product_id: string;
  product_type: ProductType;
  /** Present when product_type=course (mobile BC) */
  course_id: string | null;
  course_title: string;
  title: string;
  receipt: string;
};

/** Result after server verifies signature + Razorpay payment status */
export type VerifyPaymentResult = {
  order_id: string;
  product_id: string | null;
  course_id: string | null;
  status: 'paid';
  /** Enrollment row present (content unlocked) — courses only */
  enrolled: boolean;
  /** Product unlocked for the student */
  unlocked: boolean;
  /** Row written to purchases (+ purchased_courses for courses) */
  purchased: boolean;
  razorpay_payment_id: string;
  paid_at: string;
};

/** One row on Purchase History */
export type PurchaseHistoryItem = {
  order_id: string;
  product_id: string | null;
  product_type: ProductType;
  course_id: string | null;
  /** @deprecated Prefer `title` — kept for mobile BC */
  course_title: string;
  title: string;
  amount_paise: number;
  /** Formatted INR for UI, e.g. ₹499 */
  amount_display: string;
  currency: string;
  /** ISO date (paid_at preferred, else created_at) */
  date: string;
  /** Razorpay payment id when available */
  payment_id: string | null;
  status: PaymentOrderStatus;
  receipt_number: string;
};

export type PurchaseHistoryPage = {
  items: PurchaseHistoryItem[];
};

/** Downloadable receipt payload */
export type PurchaseReceipt = {
  order_id: string;
  filename: string;
  content_type: 'text/plain';
  /** Full receipt body for file download / share */
  receipt_text: string;
  /** Student display name on the receipt */
  student_name: string;
  item: PurchaseHistoryItem;
};

/** Admin Payment Management KPIs */
export type PaymentAdminStats = {
  today_revenue_paise: number;
  today_revenue_display: string;
  monthly_revenue_paise: number;
  monthly_revenue_display: string;
  total_orders: number;
  pending_payments: number;
  failed_payments: number;
  paid_orders: number;
  timezone: string;
};

/** Admin payment order row (list table) */
export type PaymentAdminOrder = {
  order_id: string;
  course_id: string;
  course_title: string;
  user_id: string;
  student_email: string | null;
  amount_paise: number;
  amount_display: string;
  currency: string;
  status: PaymentOrderStatus;
  payment_id: string | null;
  razorpay_order_id: string | null;
  receipt_number: string;
  date: string;
  created_at: string;
};

export type PaymentAdminListPage = {
  items: PaymentAdminOrder[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type PaymentAdminCsvExport = {
  filename: string;
  csv: string;
};

export type MotivationalQuote = {
  id: string;
  quote_text: string;
  author: string | null;
};

export type AppUpdate = {
  id: string;
  title: string;
  body: string;
  published_at: string;
};

/** Home / admin announcement (rich text + image + pin + schedule). */
export type Announcement = {
  id: string;
  title: string;
  /** HTML rich text */
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  is_published: boolean;
  /** When the announcement becomes visible on Home */
  scheduled_at: string;
  published_at: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type DashboardPayload = {
  greeting_name: string;
  quote: MotivationalQuote | null;
  banners: Banner[];
  categories: Category[];
  featured_courses: CourseSummary[];
  my_courses: Enrollment[];
  /** @deprecated Prefer `announcements` — kept for older clients */
  latest_updates: AppUpdate[];
  announcements: Announcement[];
};

export type CourseDetail = CourseSummary & {
  chapters: Chapter[];
  /** Marketing / syllabus feature bullets */
  features: string[];
  /** Same-category published courses (excludes self) */
  related_courses: CourseSummary[];
};

