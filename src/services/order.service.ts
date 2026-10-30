import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';
import { pageMeta, paginate } from '../validations/common.validation.js';
import type { OrderStatus, Prisma } from '../../generated/prisma/client';

type Tx = Prisma.TransactionClient;

const orderInclude = { items: { orderBy: { id: 'asc' } } } as const;

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const present = (order: OrderWithItems) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  totalCents: order.totalCents,
  items: order.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    unitPriceCents: item.unitPriceCents,
    quantity: item.quantity,
  })),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

export async function checkout(userId: number) {
  const order = await prisma.$transaction(async (tx: Tx) => {
    const items = await tx.cartItem.findMany({
      where: { cart: { userId } },
      include: { product: true },
      orderBy: { id: 'asc' },
    });

    if (items.length === 0) {
      throw conflict('Cart is empty');
    }

    for (const item of items) {
      // the stock condition makes the decrement safe against concurrent checkouts
      const { count } = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (count === 0) {
        throw conflict(`Insufficient stock for ${item.product.name}`);
      }
    }

    const created = await tx.order.create({
      data: {
        userId,
        totalCents: items.reduce(
          (sum, i) => sum + i.product.priceCents * i.quantity,
          0,
        ),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            name: i.product.name,
            unitPriceCents: i.product.priceCents,
            quantity: i.quantity,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({ where: { cart: { userId } } });

    return created;
  });

  return present(order);
}

export async function listOrders(
  auth: { id: number; role: string },
  query: { page: number; limit: number; status?: OrderStatus | undefined },
) {
  const where: Prisma.OrderWhereInput = {
    ...(auth.role === 'ADMIN' ? {} : { userId: auth.id }),
    ...(query.status === undefined ? {} : { status: query.status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginate(query.page, query.limit),
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders.map(present),
    meta: pageMeta(query.page, query.limit, total),
  };
}

export async function getOrder(
  auth: { id: number; role: string },
  id: number,
) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order || (auth.role !== 'ADMIN' && order.userId !== auth.id)) {
    throw notFound('Order');
  }

  return present(order);
}

async function changeStatus(id: number, next: OrderStatus) {
  const order = await prisma.$transaction(async (tx: Tx) => {
    const current = await tx.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!current) {
      throw notFound('Order');
    }

    if (!transitions[current.status].includes(next)) {
      throw conflict('Invalid status transition');
    }

    if (next === 'CANCELLED') {
      for (const item of current.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id },
      data: { status: next },
      include: orderInclude,
    });
  });

  return present(order);
}

export const updateStatus = changeStatus;

export async function cancelOwnOrder(userId: number, id: number) {
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order || order.userId !== userId) {
    throw notFound('Order');
  }

  if (order.status !== 'PENDING') {
    throw conflict('Invalid status transition');
  }

  return changeStatus(id, 'CANCELLED');
}
