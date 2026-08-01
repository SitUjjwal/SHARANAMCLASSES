/**
 * Main tabs after login: Home | Courses | Tests | Live | My Learning | Profile.
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LiveClassesScreen } from '@/modules/live-classes';
import { CoursesScreen } from '@/screens/CoursesScreen';
import { HomeDashboardScreen } from '@/screens/HomeDashboardScreen';
import { MyLearningScreen } from '@/screens/MyLearningScreen';
import { ProfileTabScreen } from '@/screens/ProfileTabScreen';
import { TestsTabScreen } from '@/screens/TestsTabScreen';
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
            TestsTab: 'document-text-outline',
            LiveTab: 'radio-outline',
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
        name="TestsTab"
        component={TestsTabScreen}
        options={{ title: 'Tests' }}
      />
      <Tab.Screen
        name="LiveTab"
        component={LiveClassesScreen}
        options={{ title: 'Live' }}
      />
      <Tab.Screen
        name="MyLearningTab"
        component={MyLearningScreen}
        options={{ title: 'My Courses' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTabScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
