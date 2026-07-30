/**
 * Navigation param lists.
 * Why: typed routes for auth + app stacks.
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type AppStackParamList = {
  Home: undefined;
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;
