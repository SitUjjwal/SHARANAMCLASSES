/**
 * CertificatesScreen — issued + pending certificates.
 */
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Screen } from '@/components/ui/Screen';
import { CertificateCard } from '@/modules/profile/components/CertificateCard';
import { fetchCertificates } from '@/modules/profile/services/certificateService';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Certificates'>;

export function CertificatesScreen({ navigation }: Props) {
  const query = useQuery({
    queryKey: ['certificates'],
    queryFn: fetchCertificates,
    staleTime: 60_000,
  });

  const items = query.data ?? [];
  const showLoading = query.isPending && !query.data;

  return (
    <Screen>
      <LoadingOverlay visible={showLoading} message="Loading certificates…" />

      {query.isError && !query.data ? (
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : 'Failed to load certificates'
          }
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : null}

      {query.data ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !showLoading}
              onRefresh={() => {
                void query.refetch();
              }}
              tintColor={colors.accent}
            />
          }
        >
          <Text style={styles.title}>Certificates</Text>
          <Text style={styles.subtitle}>
            Issued after course completion and admin approval.
          </Text>

          {items.length === 0 ? (
            <EmptyState
              icon="ribbon-outline"
              title="No certificates yet"
              message="Finish a course (100%) to request a certificate for admin approval."
            />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <CertificateCard
                  key={item.id}
                  certificate={item}
                  onPress={() =>
                    navigation.navigate('CertificateViewer', {
                      certificateId: item.id,
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
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
  subtitle: {
    color: '#A8B3C5',
    fontSize: typography.fontSize.md,
    lineHeight: 20,
    marginTop: -spacing.xs,
  },
  list: { gap: spacing.sm },
});
