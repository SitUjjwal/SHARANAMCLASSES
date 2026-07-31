/**
 * Notes module (student viewer).
 *
 * modules/notes/
 *   screens/NoteViewerScreen.tsx — HTTPS-only WebView
 *   utils/safeNotesUrl.ts        — URL validation gate
 *
 * ChapterContent → NoteViewer { courseId, chapterId, noteId }
 */
export { NoteViewerScreen } from './screens/NoteViewerScreen';
export { isSafeNotesUrl, normalizeSafeNotesUrl } from './utils/safeNotesUrl';
