import { Router } from "express";
import testRouter from './test.routes.js';
import taskRouter from './task.routes.js';
import authRouter from './auth.routes.js';
import categoryRouter from './category.routes.js';
import productRouter from './product.routes.js';
import cartRouter from './cart.routes.js';
import orderRouter from './order.routes.js';

const router = Router();

router.use(testRouter);
router.use('/tasks', taskRouter);
router.use('/auth', authRouter);
router.use('/categories', categoryRouter);
router.use('/products', productRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);

export default router;
