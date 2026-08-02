/**
 * useUpdateProfileMutation — PUT /profile and refresh React Query caches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { StudentProfile, UpdateStudentProfileInput } from '@sharanam/shared';

import { queryKeys } from '@/api/queryKeys';
import { updateProfile } from '@/modules/profile/services/profileService';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStudentProfileInput) => updateProfile(input),
    onSuccess: (profile: StudentProfile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profileOverview });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
