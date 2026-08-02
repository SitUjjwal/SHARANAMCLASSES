/**
 * Zod schema for Edit Profile form (client-side validation before API).
 */
import { z } from 'zod';

export const editProfileSchema = z.object({
  fullName: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long'),
  phoneNumber: z
    .string({ required_error: 'Phone is required' })
    .trim()
    .min(10, 'Enter a valid phone number')
    .max(15, 'Phone number is too long')
    .regex(/^[0-9+\-\s]+$/, 'Phone can only contain digits and + -'),
  classLevel: z.enum(
    ['6', '7', '8', '9', '10', '11', '12', 'competitive', 'computer'],
    {
      required_error: 'Class is required',
      invalid_type_error: 'Select a class',
    },
  ),
  medium: z.enum(['hindi', 'english'], {
    required_error: 'Medium is required',
    invalid_type_error: 'Select a medium',
  }),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
