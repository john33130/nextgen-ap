import { Router } from 'express';
import { validateToken } from '../middlewares/auth.middleware';
import controller from '../controllers/devices.route';
import { checkAccessKey, checkAccessToDevice } from '../middlewares/devices.middleware';

const router = Router();

router.get('/:deviceId/credentials', validateToken, checkAccessToDevice, controller['[deviceId]'].credentials.get);
router.patch('/:deviceId/credentials', validateToken, checkAccessToDevice, controller['[deviceId]'].credentials.patch);
router.get('/', controller.get); // get all device measurements
router.get('/:deviceId/measurements', controller['[deviceId]'].measurements.get);
router.post('/:deviceId/measurements', checkAccessKey, controller['[deviceId]'].measurements.post);
router.get('/nearest', controller.nearest.get);

export default router;
