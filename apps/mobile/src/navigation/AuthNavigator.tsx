/**
 * Unauthenticated stack: Login / Register / Forgot / Reset Password.
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ResetPasswordScreen } from '@/screens/ResetPasswordScreen';
import type { AuthStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  /** When recovering from email link, open ResetPassword first */
  initialRouteName?: keyof AuthStackParamList;
};

export function AuthNavigator({ initialRouteName = 'Login' }: AuthNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
