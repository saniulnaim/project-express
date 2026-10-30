import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as products from '../controllers/product.controller.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

router.get('/', products.list);
router.get('/:id', products.get);
router.post('/', ...admin, products.create);
router.patch('/:id', ...admin, products.update);
router.delete('/:id', ...admin, products.remove);

export default router;
