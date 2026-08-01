/**
 * Tests bottom tab — same list as stack TestList, without back button.
 */
import type { CompositeNavigationProp, NavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TestListScreen } from '@/modules/tests/screens/TestListScreen';
import type { AppStackParamList, MainTabParamList } from '@/types/navigation';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'TestsTab'>,
    NativeStackNavigationProp<AppStackParamList>
  >;
};

export function TestsTabScreen({ navigation }: Props) {
  return (
    <TestListScreen
      navigation={navigation as unknown as NavigationProp<AppStackParamList>}
      hideBack
    />
  );
}
