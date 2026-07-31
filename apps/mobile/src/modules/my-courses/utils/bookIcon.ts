/**
 * Book icon helper for My Courses list rows (📘 / 📙 / …).
 */
const BOOK_ICONS = ['📘', '📙', '📗', '📕', '📓', '📒'] as const;

export function bookIconForTitle(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash + title.charCodeAt(i) * (i + 1)) % BOOK_ICONS.length;
  }
  return BOOK_ICONS[hash] ?? '📘';
}
