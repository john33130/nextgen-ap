import { Router } from 'express';
import { checkAccessToUser } from '../middlewares/users.middleware';
import { validateToken } from '../middlewares/auth.middleware';
import controller from '../controllers/users.controller';

const router = Router();

router.get('/:userId/credentials', validateToken, checkAccessToUser, controller['[userId]'].credentials.get);
router.patch('/:userId/credentials', validateToken, checkAccessToUser, controller['[userId]'].credentials.patch);
router.delete('/:userId', validateToken, checkAccessToUser, controller['[userId]'].delete);

export default router;
