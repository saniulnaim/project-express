import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';

async function cartFor(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getCart(userId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: true }, orderBy: { id: 'asc' } },
    },
  });

  const items = (cart?.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    unitPriceCents: item.product.priceCents,
    quantity: item.quantity,
    lineTotalCents: item.product.priceCents * item.quantity,
  }));

  return {
    items,
    totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
  };
}

export async function addItem(
  userId: number,
  productId: number,
  quantity: number,
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw notFound('Product');
  }

  const cart = await cartFor(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if ((existing?.quantity ?? 0) + quantity > product.stock) {
    throw conflict('Insufficient stock');
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return getCart(userId);
}

async function ownedItem(userId: number, itemId: number) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId } },
    include: { product: true },
  });

  if (!item) {
    throw notFound('Cart item');
  }

  return item;
}

export async function setQuantity(
  userId: number,
  itemId: number,
  quantity: number,
) {
  const item = await ownedItem(userId, itemId);

  if (quantity > item.product.stock) {
    throw conflict('Insufficient stock');
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

  return getCart(userId);
}

export async function removeItem(userId: number, itemId: number) {
  await ownedItem(userId, itemId);
  await prisma.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(userId: number) {
  await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
}
