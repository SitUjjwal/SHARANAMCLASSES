/**
 * Notes REST routes (admin).
 *
 *   GET|POST          /notes
 *   GET|PUT|DELETE    /notes/:id
 */
import { Router } from 'express';

import {
  getNote,
  listNotes,
  postNote,
  putNote,
  removeNote,
} from '../controllers/note.controller';
import { requireAuth } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import {
  createNoteSchema,
  listNotesQuerySchema,
  updateNoteSchema,
} from '../validators/note.validators';

export const noteRouter = Router();

noteRouter.get(
  '/notes',
  requireAuth,
  requireAdmin,
  validate(listNotesQuerySchema, 'query'),
  listNotes,
);

noteRouter.post('/notes', requireAuth, requireAdmin, validate(createNoteSchema), postNote);

noteRouter.get('/notes/:id', requireAuth, requireAdmin, getNote);

noteRouter.put(
  '/notes/:id',
  requireAuth,
  requireAdmin,
  validate(updateNoteSchema),
  putNote,
);

noteRouter.delete('/notes/:id', requireAuth, requireAdmin, removeNote);
