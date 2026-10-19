import { Router } from 'express';
import { z } from 'zod';

const router = Router();


let tasks: Task[] = [
  { id: 1, title: 'Learn Express routing', completed: true },
  { id: 2, title: 'Build a REST API', completed: false },
];
let nextTaskId = 3;

export function resetTaskStore(): void {
  tasks = initialTasks.map(task => ({ ...task }));
  nextTaskId = 3;
}


// Read all tasks
// http://localhost:3000/tasks
// http://localhost:3000/tasks?completed=false
router.get('/tasks', (req, res) => {
  const completed = req.query.completed;

  if (completed === 'true' || completed === 'false') {
    const filteredTasks = tasks.filter(
      task => task.completed === (completed === 'true'),
    );

    return res.json(filteredTasks);
  }

  res.json(tasks);
});

// Read one task
// http://localhost:3000/tasks/1
router.get('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  const task = tasks.find(task => task.id === id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  res.json(task);
});

// zod validation
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

// Create a task
// http://localhost:3000/tasks
// {"title":"Learn TypeScript"}
router.post('/tasks', (req, res) => {
//   const { title } = req.body;

//   if (typeof title !== 'string' || !title.trim()) {
//     return res.status(400).json({
//       message: 'Title is required',
//     });
//   }

  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }
 
  const task: Task = {
    id: nextTaskId++,
    title:  result.data.title,
    completed: false,
  };

  tasks.push(task);

  res.status(201).json(task);
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  completed: z.boolean().optional(),
}).refine(
  data => data.title !== undefined || data.completed !== undefined,
  { message: 'At least one field is required' },
);

// Update a task
// http://localhost:3000/tasks/1
// {"completed":true}
router.patch('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Invalid task ID',
    });
  }

  const task = tasks.find(task => task.id === id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const result = updateTaskSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.issues,
    });
  }

  if (result.data.title !== undefined) {
    task.title = result.data.title;
  }

  if (result.data.completed !== undefined) {
    task.completed = result.data.completed;
  }  
  res.json(task);
});

// Delete a task
// http://localhost:3000/tasks/2
router.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  tasks.splice(index, 1);

  res.status(204).send();
});


export default router;