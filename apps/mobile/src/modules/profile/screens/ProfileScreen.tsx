/**
 * ProfileScreen — modern student hub.
 *
 * Hero · KPI strip · Account / Learning / Support menus · Logout
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useAppTheme } from '@/theme/ThemeProvider';
import { colors, spacing, typography } from '@/theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'ProfileTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

function SectionLabel({ title }: { title: string }) {
  const theme = useAppTheme();
  return (
    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{title}</Text>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const theme = useAppTheme();
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
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Profile</Text>

          <ProfileCard profile={overview.profile} />
          <ProfileStatsRow stats={overview.stats} />

          <View style={styles.menu}>
            <SectionLabel title="Account" />
            <SettingItem
              icon="person-outline"
              label="Edit Profile"
              subtitle="Photo, name, class & medium"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <SettingItem
              icon="settings-outline"
              label="Settings"
              subtitle="Theme, language, notifications"
              onPress={() => navigation.navigate('Settings')}
            />

            <SectionLabel title="Learning" />
            <SettingItem
              icon="ribbon-outline"
              label="Certificates"
              onPress={() => navigation.navigate('Certificates')}
            />
            <SettingItem
              icon="document-text-outline"
              label="Test History"
              onPress={() => navigation.navigate('TestHistory')}
            />

            <SectionLabel title="Support" />
            <SettingItem
              icon="chatbubble-ellipses-outline"
              label="Feedback & Support"
              onPress={() => navigation.navigate('Feedback')}
            />
            <SettingItem
              icon="log-out-outline"
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
    paddingVertical: spacing.sm,
  },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  pageTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.7,
    marginBottom: -spacing.xs,
  },
  menu: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: 2,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
