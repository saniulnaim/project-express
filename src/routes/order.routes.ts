import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as orders from '../controllers/order.controller.js';

const router = Router();

router.use(authenticate);
router.post('/', orders.checkout);
router.get('/', orders.list);
router.get('/:id', orders.get);
router.patch('/:id/status', requireRole('ADMIN'), orders.updateStatus);
router.post('/:id/cancel', orders.cancel);

export default router;
