import { Router } from 'express';
import { getNotes, createNote, deleteNote } from '../controllers/notes.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/notes', getNotes);
router.post('/notes', createNote);
router.delete('/notes/:id', auth, deleteNote);

export default router;
