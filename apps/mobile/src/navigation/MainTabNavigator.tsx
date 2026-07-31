/**
 * Main tabs after login: Home | Courses | My Learning | Profile.
 * Why: Module 3 bottom navigation — each tab has one primary job.
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { CoursesScreen } from '@/screens/CoursesScreen';
import { HomeDashboardScreen } from '@/screens/HomeDashboardScreen';
import { MyLearningScreen } from '@/screens/MyLearningScreen';
import { ProfileTabScreen } from '@/screens/ProfileTabScreen';
import type { MainTabParamList } from '@/types/navigation';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#7A8799',
        tabBarStyle: {
          backgroundColor: '#071526',
          borderTopColor: 'rgba(255,255,255,0.08)',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home-outline',
            CoursesTab: 'grid-outline',
            MyLearningTab: 'book-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeDashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesScreen}
        options={{ title: 'Courses' }}
      />
      <Tab.Screen
        name="MyLearningTab"
        component={MyLearningScreen}
        options={{ title: 'My Learning' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
