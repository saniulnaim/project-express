import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import * as cart from '../controllers/cart.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', cart.get);
router.delete('/', cart.clear);
router.post('/items', cart.addItem);
router.patch('/items/:itemId', cart.updateItem);
router.delete('/items/:itemId', cart.removeItem);

export default router;
