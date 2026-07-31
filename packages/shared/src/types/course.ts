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

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  redirect_url: string | null;
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

export type DashboardPayload = {
  greeting_name: string;
  quote: MotivationalQuote | null;
  banners: Banner[];
  categories: Category[];
  featured_courses: CourseSummary[];
  my_courses: Enrollment[];
  latest_updates: AppUpdate[];
};

export type CourseDetail = CourseSummary & {
  chapters: Chapter[];
  /** Marketing / syllabus feature bullets */
  features: string[];
  /** Same-category published courses (excludes self) */
  related_courses: CourseSummary[];
};

