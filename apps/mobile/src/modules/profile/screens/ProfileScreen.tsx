/**
 * ProfileScreen — Student Profile hub matching the product wireframe.
 *
 * Photo · Name · Class · Medium
 * Purchased Courses / Tests Completed / Average Score
 * Edit Profile · Settings · Certificates · Logout
 */
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { ProfileCard } from '@/modules/profile/components/ProfileCard';
import { ProfileStatsRow } from '@/modules/profile/components/ProfileStatsRow';
import { SettingItem } from '@/modules/profile/components/SettingItem';
import { useProfileOverviewQuery } from '@/modules/profile/hooks/useProfileOverviewQuery';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';
import { colors, spacing } from '@/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'ProfileTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function ProfileScreen({ navigation }: Props) {
  const overviewQuery = useProfileOverviewQuery();
  const logoutMutation = useLogoutMutation();

  const overview = overviewQuery.data;
  const showInitialLoading = overviewQuery.isPending && !overview;
  const errorMessage =
    overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : overviewQuery.isError
        ? 'Could not load profile'
        : null;

  return (
    <Screen style={styles.screen}>
      <LoadingOverlay
        visible={showInitialLoading || logoutMutation.isPending}
        message={logoutMutation.isPending ? 'Signing you out…' : 'Loading profile…'}
      />

      {errorMessage && !overview ? (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void overviewQuery.refetch();
          }}
        />
      ) : null}

      {overview ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={overviewQuery.isRefetching && !showInitialLoading}
              onRefresh={() => {
                void overviewQuery.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        >
          <ProfileCard profile={overview.profile} />
          <ProfileStatsRow stats={overview.stats} />

          <View style={styles.menu}>
            <SettingItem
              label="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              label="Settings"
              onPress={() => navigation.navigate('Settings')}
            />
            <SettingItem
              label="Certificates"
              onPress={() => navigation.navigate('Certificates')}
            />
            <SettingItem
              label="Test History"
              onPress={() => navigation.navigate('TestHistory')}
            />
            <SettingItem
              label="Logout"
              danger
              onPress={() => logoutMutation.mutate()}
            />
          </View>

          <ErrorMessage message={logoutMutation.error?.message} />
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingVertical: spacing.md,
  },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  menu: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
