import { Router } from 'express';

const router = Router();
// // http://localhost:3000/health
router.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'Hello from Express',
  });
});

export default router;