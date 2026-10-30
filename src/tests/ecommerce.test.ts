import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../app';
import prisma from '../lib/prisma';

const api = () => request(app);
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function registerCustomer(email = 'jane@example.com') {
  const res = await api()
    .post('/auth/register')
    .send({ email, password: 'password123', name: 'Jane' });
  return res.body.token as string;
}

async function loginAdmin() {
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('adminpass1', 10),
    },
  });
  const res = await api()
    .post('/auth/login')
    .send({ email: 'admin@example.com', password: 'adminpass1' });
  return res.body.token as string;
}

async function seedProduct(
  admin: string,
  overrides: Record<string, unknown> = {},
) {
  let categoryId = (await prisma.category.findFirst())?.id;

  if (categoryId === undefined) {
    const category = await api()
      .post('/categories')
      .set(bearer(admin))
      .send({ name: 'Gadgets' });
    categoryId = category.body.id;
  }

  const res = await api()
    .post('/products')
    .set(bearer(admin))
    .send({
      name: 'Mouse',
      description: 'A wireless mouse',
      priceCents: 1999,
      stock: 10,
      categoryId,
      ...overrides,
    });
  return res.body as { id: number; stock: number };
}

beforeEach(resetDatabase);
afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('auth', () => {
  it('registers, logs in and returns the profile without the hash', async () => {
    const register = await api()
      .post('/auth/register')
      .send({ email: ' Jane@Example.com ', password: 'password123', name: 'Jane' });

    expect(register.status).toBe(201);
    expect(register.body.user).toMatchObject({
      email: 'jane@example.com',
      role: 'CUSTOMER',
    });
    expect(register.body.user.passwordHash).toBeUndefined();

    const login = await api()
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'password123' });
    expect(login.status).toBe(200);

    const me = await api().get('/auth/me').set(bearer(login.body.token));
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('jane@example.com');
  });

  it('rejects duplicates, bad input, wrong password and bad tokens', async () => {
    await registerCustomer();

    const duplicate = await api()
      .post('/auth/register')
      .send({ email: 'jane@example.com', password: 'password123', name: 'J' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toBe('Email already registered');

    const invalid = await api()
      .post('/auth/register')
      .send({ email: 'nope', password: 'short', name: '', role: 'ADMIN' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe('Validation failed');

    const wrong = await api()
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'wrong-password' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.message).toBe('Invalid email or password');

    expect((await api().get('/auth/me')).status).toBe(401);
    expect((await api().get('/auth/me').set(bearer('garbage'))).status).toBe(401);
  });
});

describe('categories and products', () => {
  it('only lets admins write', async () => {
    const customer = await registerCustomer();

    const anonymous = await api().post('/categories').send({ name: 'Books' });
    expect(anonymous.status).toBe(401);

    const forbidden = await api()
      .post('/categories')
      .set(bearer(customer))
      .send({ name: 'Books' });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({ message: 'Forbidden' });
  });

  it('manages categories and blocks deleting one with products', async () => {
    const admin = await loginAdmin();
    const created = await api()
      .post('/categories')
      .set(bearer(admin))
      .send({ name: 'Home Office' });
    expect(created.status).toBe(201);
    expect(created.body.slug).toBe('home-office');

    const duplicate = await api()
      .post('/categories')
      .set(bearer(admin))
      .send({ name: 'Home Office' });
    expect(duplicate.status).toBe(409);

    await seedProduct(admin);
    const blocked = await api()
      .delete(`/categories/${created.body.id}`)
      .set(bearer(admin));
    expect(blocked.status).toBe(409);

    expect((await api().get('/categories/999')).status).toBe(404);
    expect((await api().get('/categories/abc')).body).toEqual({
      message: 'Invalid category ID',
    });
  });

  it('creates, reads, updates and deletes a product', async () => {
    const admin = await loginAdmin();
    const product = await seedProduct(admin);

    const read = await api().get(`/products/${product.id}`);
    expect(read.status).toBe(200);
    expect(read.body.category.name).toBe('Gadgets');
    expect(read.body.slug).toBe('mouse');

    const update = await api()
      .patch(`/products/${product.id}`)
      .set(bearer(admin))
      .send({ priceCents: 1499 });
    expect(update.body.priceCents).toBe(1499);

    const empty = await api()
      .patch(`/products/${product.id}`)
      .set(bearer(admin))
      .send({});
    expect(empty.status).toBe(400);

    const badCategory = await api()
      .post('/products')
      .set(bearer(admin))
      .send({ name: 'X', priceCents: 1, stock: 1, categoryId: 999 });
    expect(badCategory.status).toBe(404);

    const removed = await api()
      .delete(`/products/${product.id}`)
      .set(bearer(admin));
    expect(removed.status).toBe(204);
    expect((await api().get(`/products/${product.id}`)).status).toBe(404);
  });

  it('searches, filters, sorts and paginates', async () => {
    const admin = await loginAdmin();
    await seedProduct(admin, { name: 'Cheap Pen', description: 'Writes', priceCents: 100 });
    await seedProduct(admin, { name: 'Fancy Pen', description: 'Writes well', priceCents: 900 });
    await seedProduct(admin, { name: 'Notebook', description: 'Paper', priceCents: 500, stock: 0 });

    const search = await api().get('/products?q=PEN&sort=price_desc');
    expect(search.body.data.map((p: { name: string }) => p.name)).toEqual([
      'Fancy Pen',
      'Cheap Pen',
    ]);
    expect(search.body.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });

    const range = await api().get('/products?minPrice=200&maxPrice=600');
    expect(range.body.data).toHaveLength(1);
    expect(range.body.data[0].name).toBe('Notebook');

    const inStock = await api().get('/products?inStock=true');
    expect(inStock.body.meta.total).toBe(2);

    const page = await api().get('/products?sort=name&limit=2&page=2');
    expect(page.body.data.map((p: { name: string }) => p.name)).toEqual(['Notebook']);
    expect(page.body.meta.totalPages).toBe(2);

    const badRange = await api().get('/products?minPrice=900&maxPrice=100');
    expect(badRange.status).toBe(400);
    expect((await api().get('/products?limit=1000')).status).toBe(400);
  });
});

describe('cart and orders', () => {
  it('manages the cart and enforces stock', async () => {
    const admin = await loginAdmin();
    const customer = await registerCustomer();
    const product = await seedProduct(admin, { stock: 3 });

    expect((await api().get('/cart').set(bearer(customer))).body).toEqual({
      items: [],
      totalCents: 0,
    });

    const added = await api()
      .post('/cart/items')
      .set(bearer(customer))
      .send({ productId: product.id, quantity: 2 });
    expect(added.status).toBe(201);
    expect(added.body.totalCents).toBe(3998);

    const tooMany = await api()
      .post('/cart/items')
      .set(bearer(customer))
      .send({ productId: product.id, quantity: 2 });
    expect(tooMany.status).toBe(409);

    const missing = await api()
      .post('/cart/items')
      .set(bearer(customer))
      .send({ productId: 999, quantity: 1 });
    expect(missing.status).toBe(404);

    const itemId = added.body.items[0].id;
    const updated = await api()
      .patch(`/cart/items/${itemId}`)
      .set(bearer(customer))
      .send({ quantity: 3 });
    expect(updated.body.items[0].quantity).toBe(3);

    const other = await registerCustomer('other@example.com');
    const stolen = await api().delete(`/cart/items/${itemId}`).set(bearer(other));
    expect(stolen.status).toBe(404);

    expect((await api().delete('/cart').set(bearer(customer))).status).toBe(204);
    expect((await api().get('/cart').set(bearer(customer))).body.items).toEqual([]);
  });

  it('checks out atomically, then cancelling restores stock', async () => {
    const admin = await loginAdmin();
    const customer = await registerCustomer();
    const product = await seedProduct(admin, { stock: 5 });

    expect((await api().post('/orders').set(bearer(customer))).body.message).toBe(
      'Cart is empty',
    );

    await api()
      .post('/cart/items')
      .set(bearer(customer))
      .send({ productId: product.id, quantity: 2 });

    const order = await api().post('/orders').set(bearer(customer));
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      status: 'PENDING',
      totalCents: 3998,
      items: [{ productId: product.id, name: 'Mouse', unitPriceCents: 1999, quantity: 2 }],
    });
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(3);
    expect((await api().get('/cart').set(bearer(customer))).body.items).toEqual([]);

    // later price edits do not change the stored order
    await api()
      .patch(`/products/${product.id}`)
      .set(bearer(admin))
      .send({ priceCents: 5000 });
    const reread = await api().get(`/orders/${order.body.id}`).set(bearer(customer));
    expect(reread.body.items[0].unitPriceCents).toBe(1999);

    const blockedDelete = await api()
      .delete(`/products/${product.id}`)
      .set(bearer(admin));
    expect(blockedDelete.status).toBe(409);

    const cancel = await api()
      .post(`/orders/${order.body.id}/cancel`)
      .set(bearer(customer));
    expect(cancel.body.status).toBe('CANCELLED');
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(5);

    const again = await api()
      .post(`/orders/${order.body.id}/cancel`)
      .set(bearer(customer));
    expect(again.status).toBe(409);
  });

  it('rolls back the whole checkout when one item lacks stock', async () => {
    const admin = await loginAdmin();
    const customer = await registerCustomer();
    const plenty = await seedProduct(admin, { name: 'Plenty', stock: 10 });
    const scarce = await seedProduct(admin, { name: 'Scarce', stock: 2 });

    for (const [p, quantity] of [[plenty, 1], [scarce, 2]] as const) {
      await api()
        .post('/cart/items')
        .set(bearer(customer))
        .send({ productId: p.id, quantity });
    }

    // someone else buys the scarce item first
    await prisma.product.update({ where: { id: scarce.id }, data: { stock: 1 } });

    const res = await api().post('/orders').set(bearer(customer));
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Insufficient stock for Scarce');
    expect((await prisma.product.findUnique({ where: { id: plenty.id } }))?.stock).toBe(10);
    expect(await prisma.order.count()).toBe(0);
    expect((await api().get('/cart').set(bearer(customer))).body.items).toHaveLength(2);
  });

  it('scopes order visibility and enforces status transitions', async () => {
    const admin = await loginAdmin();
    const jane = await registerCustomer();
    const bob = await registerCustomer('bob@example.com');
    const product = await seedProduct(admin);

    await api()
      .post('/cart/items')
      .set(bearer(jane))
      .send({ productId: product.id, quantity: 1 });
    const order = (await api().post('/orders').set(bearer(jane))).body;

    expect((await api().get(`/orders/${order.id}`).set(bearer(bob))).status).toBe(404);
    expect((await api().get('/orders').set(bearer(bob))).body.meta.total).toBe(0);
    expect((await api().get('/orders').set(bearer(jane))).body.meta.total).toBe(1);
    expect((await api().get('/orders').set(bearer(admin))).body.meta.total).toBe(1);
    expect((await api().get('/orders?status=PAID').set(bearer(admin))).body.meta.total).toBe(0);

    const asCustomer = await api()
      .patch(`/orders/${order.id}/status`)
      .set(bearer(jane))
      .send({ status: 'PAID' });
    expect(asCustomer.status).toBe(403);

    const skip = await api()
      .patch(`/orders/${order.id}/status`)
      .set(bearer(admin))
      .send({ status: 'DELIVERED' });
    expect(skip.status).toBe(409);
    expect(skip.body.message).toBe('Invalid status transition');

    for (const status of ['PAID', 'SHIPPED', 'DELIVERED']) {
      const res = await api()
        .patch(`/orders/${order.id}/status`)
        .set(bearer(admin))
        .send({ status });
      expect(res.body.status).toBe(status);
    }

    const bad = await api()
      .patch(`/orders/${order.id}/status`)
      .set(bearer(admin))
      .send({ status: 'LOST' });
    expect(bad.status).toBe(400);
  });
});

describe('misc', () => {
  it('returns JSON for unknown routes and malformed bodies', async () => {
    expect((await api().get('/nope')).status).toBe(404);

    const res = await api()
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid JSON body');
  });
});
