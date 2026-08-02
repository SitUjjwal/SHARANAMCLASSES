/**
 * AchievementsScreen — catalog with unlock state.
 */
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { Achievement, ApiSuccessResponse } from '@sharanam/shared';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { AchievementCard } from '@/modules/profile/components/AchievementCard';
import { apiClient } from '@/api/client';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Achievements'>;

async function fetchAchievements(): Promise<Achievement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Achievement[]>>('/achievements');
  return data.data;
}

export function AchievementsScreen(_props: Props) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchAchievements());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <LoadingOverlay visible={loading} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Achievements</Text>
        <ErrorMessage message={error} />
        {!loading && items.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="No achievements"
            message="Keep learning to unlock badges."
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <AchievementCard key={item.id} achievement={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.xl },
  title: {
    color: colors.surface,
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  list: { gap: spacing.sm },
});
