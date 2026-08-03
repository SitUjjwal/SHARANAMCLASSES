/**
 * CategoryCard — one tappable subject tile.
 * Why: reusable on Home grid, Courses browse, and future search results.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Category } from '@sharanam/shared';
import { CategoryIcon } from '@/modules/categories/components/CategoryIcon';
import { categoryHasExternalLink } from '@/modules/categories/utils/openCategoryAction';
import { colors, spacing, typography } from '@/theme';

export type CategoryCardProps = {
  category: Category;
  onPress: (category: Category) => void;
};

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const hasLink = categoryHasExternalLink(category);

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(category)}
      accessibilityRole="button"
      accessibilityLabel={
        hasLink ? `${category.name}, opens external link` : category.name
      }
    >
      <CategoryIcon icon={category.icon} />
      <Text style={styles.label} numberOfLines={2}>
        {category.name}
      </Text>
      {hasLink ? (
        <View style={styles.linkHint} accessibilityElementsHidden>
          <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.55)" />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: {
    flex: 1,
    color: colors.surface,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  linkHint: {
    marginLeft: 2,
  },
});
