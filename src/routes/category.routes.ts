import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as categories from '../controllers/category.controller.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

router.get('/', categories.list);
router.get('/:id', categories.get);
router.post('/', ...admin, categories.create);
router.patch('/:id', ...admin, categories.update);
router.delete('/:id', ...admin, categories.remove);

export default router;
