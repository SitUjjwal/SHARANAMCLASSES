/**
 * Zod validators for admin teacher create / update / assign.
 */
import { z } from 'zod';

export const createTeacherSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone_number: z
    .string()
    .trim()
    .min(10)
    .max(15)
    .regex(/^[0-9+\-\s]+$/, 'Phone must be digits'),
  password: z.string().min(8).max(72),
  /** If email already exists as student, promote to instructor instead of failing. */
  promote_if_exists: z.boolean().optional().default(true),
});

export const updateTeacherSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional(),
  phone_number: z
    .string()
    .trim()
    .min(10)
    .max(15)
    .regex(/^[0-9+\-\s]+$/, 'Phone must be digits')
    .optional(),
});

export const assignCoursesSchema = z.object({
  course_ids: z.array(z.string().uuid()).max(200),
});

export const assignLiveClassesSchema = z.object({
  live_class_ids: z.array(z.string().uuid()).max(200),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type AssignCoursesInput = z.infer<typeof assignCoursesSchema>;
export type AssignLiveClassesInput = z.infer<typeof assignLiveClassesSchema>;
