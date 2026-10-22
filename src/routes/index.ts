import { Router } from "express";
import testRouter from './test.routes.js';
import taskRouter from './task.routes.js';

const router = Router();

router.use(testRouter);
router.use('/tasks', taskRouter);

export default router;