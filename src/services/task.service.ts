
import prisma from '../lib/prisma';
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from '../validations/task.validation';

const initialTasks = [
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

export async function resetTaskStore(): Promise<void> {
  await prisma.$transaction([
    prisma.task.deleteMany(),
    prisma.task.createMany({
      data: initialTasks,
    }),
  ]);
}

export async function getAllTasks(completed?: boolean) {
  return prisma.task.findMany({
    where:
      completed === undefined
        ? {}
        : { completed },
    orderBy: {
      id: 'asc',
    },
  });
}

export async function getTaskById(id: number) {
  return prisma.task.findUnique({
    where: { id },
  });
}

export async function createTask(input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: input.title,
      completed: false,
    },
  });
}


export async function updateTask(
  id: number,
  input: UpdateTaskInput,
) {
  const existingTask = await prisma.task.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return null;
  }

  const data: {
    title?: string;
    completed?: boolean;
  } = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.completed !== undefined) {
    data.completed = input.completed;
  }

  return prisma.task.update({
    where: { id },
    data,
  });
}

export async function deleteTask(id: number): Promise<boolean> {
  const result = await prisma.task.deleteMany({
    where: { id },
  });

  return result.count > 0;
}
