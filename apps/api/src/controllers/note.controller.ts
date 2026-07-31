/**
 * Notes HTTP handlers — admin flat REST.
 */
import type { NextFunction, Request, Response } from 'express';

import {
  createNote,
  deleteNote,
  getNoteForAdmin,
  listNotesForAdmin,
  updateNote,
} from '../services/note.service';
import type {
  CreateNoteInput,
  ListNotesQuery,
  UpdateNoteInput,
} from '../validators/note.validators';
import { requireParam } from '../utils/params';

/** GET /notes */
export async function listNotes(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = req.query as unknown as ListNotesQuery;
    const data = await listNotesForAdmin(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /notes/:id */
export async function getNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const noteId = requireParam(req.params.id, 'id');
    const data = await getNoteForAdmin(noteId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /notes */
export async function postNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = req.body as CreateNoteInput;
    const data = await createNote(input);
    res.status(201).json({ success: true, data, message: 'Note created' });
  } catch (error) {
    next(error);
  }
}

/** PUT /notes/:id */
export async function putNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const noteId = requireParam(req.params.id, 'id');
    const input = req.body as UpdateNoteInput;
    const data = await updateNote(noteId, input);
    res.status(200).json({ success: true, data, message: 'Note updated' });
  } catch (error) {
    next(error);
  }
}

/** DELETE /notes/:id */
export async function removeNote(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const noteId = requireParam(req.params.id, 'id');
    await deleteNote(noteId);
    res.status(200).json({ success: true, data: null, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
}
