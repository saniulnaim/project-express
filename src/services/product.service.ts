import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';
import { slugify } from '../lib/slug.js';
import { pageMeta, paginate } from '../validations/common.validation.js';
import type { Prisma } from '../../generated/prisma/client';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '../validations/product.validation.js';

const withCategory = {
  category: { select: { id: true, name: true, slug: true } },
} as const;

const orderBy: Record<
  ListProductsQuery['sort'],
  Prisma.ProductOrderByWithRelationInput[]
> = {
  price_asc: [{ priceCents: 'asc' }, { id: 'asc' }],
  price_desc: [{ priceCents: 'desc' }, { id: 'asc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
  name: [{ name: 'asc' }, { id: 'asc' }],
};

async function assertCategoryExists(id: number) {
  if (!(await prisma.category.findUnique({ where: { id } }))) {
    throw notFound('Category');
  }
}

async function uniqueSlug(name: string, exceptId?: number) {
  const base = slugify(name);
  const taken = new Set(
    (
      await prisma.product.findMany({
        where: {
          slug: { startsWith: base },
          ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
        },
        select: { slug: true },
      })
    ).map((p) => p.slug),
  );

  let slug = base;

  for (let n = 2; taken.has(slug); n++) {
    slug = `${base}-${n}`;
  }

  return slug;
}

export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {
    ...(query.q === undefined
      ? {}
      : {
          OR: [
            { name: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }),
    ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
    ...(query.minPrice === undefined && query.maxPrice === undefined
      ? {}
      : {
          priceCents: {
            ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
            ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
          },
        }),
    ...(query.inStock ? { stock: { gt: 0 } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderBy[query.sort],
      ...paginate(query.page, query.limit),
    }),
    prisma.product.count({ where }),
  ]);

  return { data, meta: pageMeta(query.page, query.limit, total) };
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: withCategory,
  });

  if (!product) {
    throw notFound('Product');
  }

  return product;
}

export async function createProduct(input: CreateProductInput) {
  await assertCategoryExists(input.categoryId);

  return prisma.product.create({
    data: { ...input, slug: await uniqueSlug(input.name) },
    include: withCategory,
  });
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  await getProduct(id);

  if (input.categoryId !== undefined) {
    await assertCategoryExists(input.categoryId);
  }

  const data: Prisma.ProductUncheckedUpdateInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

  if (input.name !== undefined) {
    data.slug = await uniqueSlug(input.name, id);
  }

  return prisma.product.update({ where: { id }, data, include: withCategory });
}

export async function deleteProduct(id: number) {
  await getProduct(id);

  if ((await prisma.orderItem.count({ where: { productId: id } })) > 0) {
    throw conflict('Product has been ordered');
  }

  await prisma.product.delete({ where: { id } });
}
