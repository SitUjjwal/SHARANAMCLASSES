export {
  registerWithEmail,
  loginWithEmail,
  sendPasswordReset,
  logout,
  getCurrentSession,
} from './auth.service';
export type { RegisterResult, LoginResult } from './auth.service';
export { insertStudentProfile } from './profile.service';
export { getHealth } from './health.service';
export type { HealthResponse } from './health.service';
