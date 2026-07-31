/**
 * Categories browse screen — grid from GET /categories (Supabase via API).
 * Search box filters client-side today; pass `search` to useCategoriesQuery for server-side later.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CategoriesGrid, useCategoriesQuery } from '@/modules/categories';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { spacing } from '@/theme';
import type { Category } from '@sharanam/shared';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'CoursesTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function CategoriesScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const categoriesQuery = useCategoriesQuery();

  function onSelect(category: Category) {
    navigation.navigate('CoursesTab', { categoryId: category.id });
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <SectionHeader title="Categories" />
        <AppTextField
          label="Search"
          placeholder="Search subjects…"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {categoriesQuery.isLoading && !categoriesQuery.data ? (
        <View style={styles.skeleton}>
          <SkeletonBlock height={64} radius={14} />
          <SkeletonBlock height={64} radius={14} />
        </View>
      ) : null}

      {categoriesQuery.isError && !categoriesQuery.data ? (
        <ErrorState
          message={getApiErrorMessage(categoriesQuery.error)}
          onRetry={() => {
            void categoriesQuery.refetch();
          }}
        />
      ) : null}

      {categoriesQuery.data ? (
        <View style={styles.body}>
          <CategoriesGrid
            categories={categoriesQuery.data}
            onSelect={onSelect}
            searchQuery={search}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  skeleton: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
