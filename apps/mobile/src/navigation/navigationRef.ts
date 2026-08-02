/**
 * Shared navigation container ref — used by notification deep links
 * (including cold start) when React tree is not the caller.
 */
import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '@/types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
