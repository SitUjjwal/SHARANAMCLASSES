/**
 * Backup API validators.
 */
import { z } from 'zod';

export const updateBackupJobSchema = z.object({
  enabled: z.boolean().optional(),
  cron: z.string().trim().min(5).max(80).optional(),
  timezone: z.string().trim().min(2).max(80).optional(),
  include_db: z.boolean().optional(),
  include_r2_metadata: z.boolean().optional(),
  include_settings: z.boolean().optional(),
  retain_days: z.number().int().min(1).max(365).optional(),
});

export const restoreBackupSchema = z.object({
  mode: z.enum(['settings', 'settings_and_r2_metadata']).default('settings'),
});

export type UpdateBackupJobInput = z.infer<typeof updateBackupJobSchema>;
export type RestoreBackupInput = z.infer<typeof restoreBackupSchema>;
