
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../services/task.service';

import {
  createTaskSchema,
  updateTaskSchema,
} from '../validations/task.validation';

function parseTaskId(rawId: string): number | undefined {
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return undefined;
  }

  return id;
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const completedQuery = req.query.completed;

    const completed =
      completedQuery === 'true'
        ? true
        : completedQuery === 'false'
          ? false
          : undefined;

    const tasks = await getAllTasks(completed);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

export async function getTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseTaskId(String(req.params.id));

    if (id === undefined) {
      res.status(400).json({ message: 'Invalid task ID' });
      return;
    }

    const task = await getTaskById(id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function postTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = createTaskSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues,
      });
      return;
    }

    const task = await createTask(result.data);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

export async function patchTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseTaskId(String(req.params.id));

    if (id === undefined) {
      res.status(400).json({ message: 'Invalid task ID' });
      return;
    }

    const result = updateTaskSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues,
      });
      return;
    }

    const task = await updateTask(id, result.data);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

export async function removeTask(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseTaskId(String(req.params.id));

    if (id === undefined) {
      res.status(400).json({ message: 'Invalid task ID' });
      return;
    }

    const deleted = await deleteTask(id);

    if (!deleted) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
