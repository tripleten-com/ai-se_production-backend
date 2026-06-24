import { Router } from 'express';
import { register, login, getProfile } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', auth, getProfile);

export default router;
