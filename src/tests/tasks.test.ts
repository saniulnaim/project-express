
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';
import { resetTaskStore } from '../routes/task.routes';

beforeEach(() => {
  resetTaskStore();
});

describe('Task API', () => {
  it('GET /tasks should return all tasks', async () => {
    const response = await request(app).get('/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe(
      'Learn Express routing',
    );
  });

  it('GET /tasks/:id should return one task', async () => {
    const response = await request(app).get('/tasks/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('GET /tasks/:id should return 404 for a missing task', async () => {
    const response = await request(app).get('/tasks/999');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Task not found');
  });

  it('POST /tasks should create a task', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: 'Learn Vitest' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Learn Vitest');
    expect(response.body.completed).toBe(false);
  });

  it('POST /tasks should reject an empty title', async () => {
    const response = await request(app)
      .post('/tasks')
      .send({ title: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('PATCH /tasks/:id should update a task', async () => {
    const response = await request(app)
      .patch('/tasks/1')
      .send({ completed: false });

    expect(response.status).toBe(200);
    expect(response.body.completed).toBe(false);
  });

  it('PATCH /tasks/:id should reject a non-boolean completed value', async () => {
    const response = await request(app)
      .patch('/tasks/1')
      .send({ completed: 'yes' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('DELETE /tasks/:id should delete a task', async () => {
    const response = await request(app).delete('/tasks/2');

    expect(response.status).toBe(204);

    const listResponse = await request(app).get('/tasks');

    expect(listResponse.body).toHaveLength(1);
  });
});
