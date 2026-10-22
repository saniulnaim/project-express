import { Router } from 'express';

import {
  listTasks,
  getTask,
  postTask,
  patchTask,
  removeTask,
} from '../controllers/task.controller';

const router = Router();

router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/', postTask);
router.patch('/:id', patchTask);
router.delete('/:id', removeTask);

export default router;