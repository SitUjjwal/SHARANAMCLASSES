/**
 * Categories module public API.
 *
 * Folder structure
 * ----------------
 * modules/categories/
 *   components/
 *     CategoryIcon.tsx   — dynamic emoji / Ionicons
 *     CategoryCard.tsx   — reusable tile
 *     CategoriesGrid.tsx — grid + empty + optional search filter
 *   hooks/
 *     useCategoriesQuery.ts — React Query → GET /categories
 *   utils/
 *     filterCategories.ts — client-side search helper (future UI)
 *   index.ts             — barrel exports
 *
 * Data flow: Supabase `categories` → API GET /categories → hook → grid
 */
export { CategoryIcon } from './components/CategoryIcon';
export { CategoryCard } from './components/CategoryCard';
export type { CategoryCardProps } from './components/CategoryCard';
export { CategoriesGrid } from './components/CategoriesGrid';
export type { CategoriesGridProps } from './components/CategoriesGrid';
export { useCategoriesQuery } from './hooks/useCategoriesQuery';
export { filterCategories } from './utils/filterCategories';
export {
  categoryHasExternalLink,
  openCategoryExternalLink,
} from './utils/openCategoryAction';
export { CategoriesScreen } from './screens/CategoriesScreen';
