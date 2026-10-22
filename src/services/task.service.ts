import type { Task } from '../models/task.model';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../validations/task.validation';

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Learn Express routing',
    completed: true,
  },
  {
    id: 2,
    title: 'Build a REST API',
    completed: false,
  },
];

let tasks: Task[] = initialTasks.map((task) => ({
  ...task,
}));

let nextTaskId = 3;

export function resetTaskStore(): void {
  tasks = initialTasks.map((task) => ({ ...task }));
  nextTaskId = 3;
}

export function getAllTasks(
  completed?: boolean,
): Task[] {
  if (completed === undefined) {
    return tasks;
  }

  return tasks.filter(
    (task) => task.completed === completed,
  );
}

export function getTaskById(id: number): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function createTask(input: CreateTaskInput): Task {
  const task: Task = {
    id: nextTaskId++,
    title: input.title,
    completed: false,
  };

  tasks.push(task);
  return task;
}

export function updateTask(
  id: number,
  input: UpdateTaskInput,
): Task | undefined {
  const task = getTaskById(id);

  if (!task) {
    return undefined;
  }

  if (input.title !== undefined) {
    task.title = input.title;
  }

  if (input.completed !== undefined) {
    task.completed = input.completed;
  }

  return task;
}

export function deleteTask(id: number): boolean {
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  return true;
}