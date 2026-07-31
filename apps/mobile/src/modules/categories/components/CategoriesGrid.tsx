/**
 * CategoriesGrid — lays out CategoryCards.
 *
 * Props:
 * - `categories` — from dashboard or useCategoriesQuery
 * - `searchQuery` — optional client filter (future search box)
 * - `onSelect` — navigate to courses for that category
 */
import { StyleSheet, View } from 'react-native';

import type { Category } from '@sharanam/shared';
import { CategoryCard } from '@/modules/categories/components/CategoryCard';
import { filterCategories } from '@/modules/categories/utils/filterCategories';
import { EmptyState } from '@/components/ui/EmptyState';
import { spacing } from '@/theme';

export type CategoriesGridProps = {
  categories: Category[];
  onSelect: (category: Category) => void;
  /** Future search — filters locally without extra fetch */
  searchQuery?: string;
};

export function CategoriesGrid({
  categories,
  onSelect,
  searchQuery,
}: CategoriesGridProps) {
  const visible = filterCategories(categories, searchQuery);

  if (!visible.length) {
    return (
      <EmptyState
        icon="grid-outline"
        title={searchQuery?.trim() ? 'No matches' : 'No categories'}
        message={
          searchQuery?.trim()
            ? 'Try a different search term.'
            : 'Subjects will appear here after the catalog is set up.'
        }
      />
    );
  }

  return (
    <View style={styles.grid}>
      {visible.map((category) => (
        <CategoryCard key={category.id} category={category} onPress={onSelect} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
