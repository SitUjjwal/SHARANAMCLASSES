/**
 * Student class / medium options for registration.
 * Why: keep selectable values in one place for forms + future filters.
 */
export const CLASS_OPTIONS = [
  { label: 'Class 6', value: '6' },
  { label: 'Class 7', value: '7' },
  { label: 'Class 8', value: '8' },
  { label: 'Class 9', value: '9' },
  { label: 'Class 10', value: '10' },
  { label: 'Class 11', value: '11' },
  { label: 'Class 12', value: '12' },
  { label: 'Competitive Exam', value: 'competitive' },
  { label: 'Computer Class', value: 'computer' },
] as const;

export const MEDIUM_OPTIONS = [
  { label: 'Hindi', value: 'hindi' },
  { label: 'English', value: 'english' },
] as const;

export type ClassValue = (typeof CLASS_OPTIONS)[number]['value'];
export type MediumValue = (typeof MEDIUM_OPTIONS)[number]['value'];
