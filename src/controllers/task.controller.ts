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

export function listTasks(
  req: Request,
  res: Response,
): void {
  const completedQuery = req.query.completed;

  const completed =
    completedQuery === 'true'
      ? true
      : completedQuery === 'false'
        ? false
        : undefined;

  res.status(200).json(getAllTasks(completed));
}

export function getTask(
  req: Request,
  res: Response,
): void {
  const id = parseTaskId(String(req.params.id));

  if (id === undefined) {
    res.status(400).json({ message: 'Invalid task ID' });
    return;
  }

  const task = getTaskById(id);

  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  res.status(200).json(task);
}

export function postTask(
  req: Request,
  res: Response,
): void {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues,
    });
    return;
  }

  res.status(201).json(createTask(result.data));
}

export function patchTask(
  req: Request,
  res: Response,
): void {
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

  const task = updateTask(id, result.data);

  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  res.status(200).json(task);
}

export function removeTask(
  req: Request,
  res: Response,
): void {
  const id = parseTaskId(String(req.params.id));

  if (id === undefined) {
    res.status(400).json({ message: 'Invalid task ID' });
    return;
  }

  const deleted = deleteTask(id);

  if (!deleted) {
    res.status(404).json({ message: 'Task not found' });
    return;
  }

  res.status(204).send();
}