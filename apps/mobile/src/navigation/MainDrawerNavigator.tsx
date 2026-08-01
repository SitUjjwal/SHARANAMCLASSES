/**
 * Drawer wrapper around bottom tabs — hamburger opens AppDrawerContent.
 */
import { createDrawerNavigator } from '@react-navigation/drawer';

import { AppDrawerContent } from '@/navigation/AppDrawerContent';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import type { MainDrawerParamList } from '@/types/navigation';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export function MainDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '78%',
          backgroundColor: '#FFFFFF',
        },
        overlayColor: 'rgba(15, 23, 42, 0.45)',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}
