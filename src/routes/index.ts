import { Router } from "express";
import healthRouter from './health.routes.js';
import testRouter from './test.routes.js';
import taskRouter from './task.routes.js';

const router = Router();

router.use(healthRouter);
router.use(testRouter);
router.use(taskRouter);

export default router;