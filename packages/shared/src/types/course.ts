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
  /** List price in INR */
  price: number;
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

/** Full chapter for content screen */
export type ChapterDetail = Chapter & {
  course_id: string;
  course_title: string;
  contents: ChapterContentItem[];
};


export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  enrolled_at: string;
  course?: CourseSummary | null;
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

