/**
 * Authenticated stack: tabs + course / chapter screens above tabs.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChapterContentScreen, ChapterListScreen } from '@/modules/chapters';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import { CourseDetailScreen } from '@/screens/CourseDetailScreen';
import type { AppStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="ChapterList" component={ChapterListScreen} />
      <Stack.Screen name="ChapterContent" component={ChapterContentScreen} />
    </Stack.Navigator>
  );
}
