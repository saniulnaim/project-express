import { Router } from "express";
import healthRouter from './health.routes.js';
import testRouter from './test.routes.js';

const router = Router();

router.use(healthRouter);
router.use(testRouter);

export default router;