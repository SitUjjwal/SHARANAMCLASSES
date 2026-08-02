/**
 * EditProfileScreen — validate → optional R2 avatar upload → PATCH Supabase profile.
 */
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { Screen } from '@/components/ui/Screen';
import { CLASS_OPTIONS, MEDIUM_OPTIONS } from '@/constants/studentOptions';
import { AvatarPicker } from '@/modules/profile/components/AvatarPicker';
import { useProfileQuery } from '@/modules/profile/hooks/useProfileQuery';
import { useUpdateProfileMutation } from '@/modules/profile/hooks/useUpdateProfileMutation';
import {
  editProfileSchema,
  type EditProfileFormValues,
} from '@/modules/profile/schemas/editProfileSchema';
import { uploadProfileAvatar } from '@/modules/profile/services/profileService';
import type { AppStackParamList } from '@/types/navigation';
import { colors, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

type PendingAvatar = {
  uri: string;
  mimeType: string;
};

export function EditProfileScreen({ navigation }: Props) {
  const profileQuery = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const [pendingAvatar, setPendingAvatar] = useState<PendingAvatar | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      classLevel: '10',
      medium: 'hindi',
    },
  });

  useEffect(() => {
    if (!profileQuery.data || hydrated) return;
    const profile = profileQuery.data;
    reset({
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      classLevel: (['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'].includes(
        profile.class_level,
      )
        ? profile.class_level
        : '10') as EditProfileFormValues['classLevel'],
      medium: profile.medium === 'english' ? 'english' : 'hindi',
    });
    setHydrated(true);
  }, [profileQuery.data, hydrated, reset]);

  const displayName = watch('fullName') || profileQuery.data?.full_name || 'Student';
  const busy = uploading || updateMutation.isPending || isSubmitting;
  const showLoading =
    (profileQuery.isPending && !profileQuery.data) || busy;

  const loadError =
    profileQuery.error instanceof Error
      ? profileQuery.error.message
      : profileQuery.isError
        ? 'Failed to load profile'
        : null;

  async function onSave(values: EditProfileFormValues) {
    setFormError(null);
    try {
      let avatar_url: string | undefined;
      let avatar_storage_key: string | undefined;

      if (pendingAvatar) {
        setUploading(true);
        const uploaded = await uploadProfileAvatar({
          uri: pendingAvatar.uri,
          mimeType: pendingAvatar.mimeType,
        });
        avatar_url = uploaded.avatar_url;
        avatar_storage_key = uploaded.avatar_storage_key;
        setUploading(false);
      }

      await updateMutation.mutateAsync({
        full_name: values.fullName.trim(),
        phone_number: values.phoneNumber.trim(),
        class_level: values.classLevel,
        medium: values.medium,
        ...(avatar_url
          ? { avatar_url, avatar_storage_key: avatar_storage_key ?? null }
          : {}),
      });

      navigation.goBack();
    } catch (err) {
      setUploading(false);
      setFormError(err instanceof Error ? err.message : 'Could not save profile');
    }
  }

  return (
    <Screen>
      <LoadingOverlay
        visible={showLoading}
        message={
          uploading
            ? 'Uploading photo…'
            : updateMutation.isPending || isSubmitting
              ? 'Saving…'
              : 'Loading…'
        }
      />

      {loadError && !profileQuery.data ? (
        <ErrorState
          message={loadError}
          onRetry={() => {
            void profileQuery.refetch();
          }}
        />
      ) : null}

      {profileQuery.data ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Edit Profile</Text>
          <Text style={styles.subtitle}>
            Update your details. Photos upload to Cloudflare R2, then save to your profile.
          </Text>

          <AvatarPicker
            name={displayName}
            remoteUrl={profileQuery.data.avatar_url}
            localUri={pendingAvatar?.uri}
            disabled={busy}
            onPicked={(uri, mimeType) => setPendingAvatar({ uri, mimeType })}
          />

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppTextField
                label="Phone"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phoneNumber?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          <Controller
            control={control}
            name="classLevel"
            render={({ field: { onChange, value } }) => (
              <View>
                <OptionGroup
                  label="Class"
                  options={CLASS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={value}
                  onChange={onChange}
                />
                {errors.classLevel?.message ? (
                  <Text style={styles.fieldError}>{errors.classLevel.message}</Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="medium"
            render={({ field: { onChange, value } }) => (
              <View>
                <OptionGroup
                  label="Medium"
                  options={MEDIUM_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={value}
                  onChange={(v) => onChange(v as EditProfileFormValues['medium'])}
                />
                {errors.medium?.message ? (
                  <Text style={styles.fieldError}>{errors.medium.message}</Text>
                ) : null}
              </View>
            )}
          />

          <ErrorMessage
            message={
              formError ??
              (updateMutation.error instanceof Error ? updateMutation.error.message : null)
            }
          />

          <View style={styles.actions}>
            <AppButton
              label="Save changes"
              onPress={handleSubmit((values) => {
                void onSave(values);
              })}
              loading={busy}
              disabled={busy}
            />
            <AppButton
              label="Cancel"
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={busy}
            />
          </View>
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
    marginBottom: spacing.xs,
  },
  fieldError: {
    color: '#F28B82',
    fontSize: typography.fontSize.sm,
    marginTop: -spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
