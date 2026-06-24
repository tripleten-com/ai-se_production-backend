import type { Request, Response } from 'express';
import Note from '../models/note.js';

export const getNotes = async (req: Request, res: Response) => {
  const notes = await Note.find({});
  res.status(200).json({ success: true, data: notes, error: null });
};

export const createNote = async (req: Request, res: Response) => {
  const { title, body } = req.body;

  if (!title || !body) {
    res.status(400).json({
      success: false,
      data: null,
      error: { message: 'title and body are required' },
    });
    return;
  }

  const note = await Note.create({ title, body });
  res.status(201).json({ success: true, data: note, error: null });
};

export const deleteNote = async (req: Request, res: Response) => {
  const note = await Note.findByIdAndDelete(req.params.id);

  if (!note) {
    res.status(404).json({
      success: false,
      data: null,
      error: { message: 'Note not found' },
    });
    return;
  }

  res
    .status(200)
    .json({ success: true, data: { message: 'Note deleted' }, error: null });
};
