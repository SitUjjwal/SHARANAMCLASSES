/**
 * Drawer wrapper around bottom tabs — hamburger opens AppDrawerContent.
 */
import { createDrawerNavigator } from '@react-navigation/drawer';

import { AppDrawerContent } from '@/navigation/AppDrawerContent';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MainDrawerParamList } from '@/types/navigation';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export function MainDrawerNavigator() {
  const theme = useAppTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '82%',
          backgroundColor: theme.canvas,
        },
        overlayColor: 'rgba(11, 31, 58, 0.55)',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabNavigator} />
    </Drawer.Navigator>
  );
}
