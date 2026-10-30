import prisma from '../lib/prisma.js';
import { conflict, notFound } from '../lib/errors.js';
import { slugify } from '../lib/slug.js';
import type { CategoryInput } from '../validations/category.validation.js';

export function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function getCategory(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw notFound('Category');
  }

  return category;
}

async function assertNameFree(name: string, exceptId?: number) {
  const clash = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug: slugify(name) }],
      ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
    },
  });

  if (clash) {
    throw conflict('Category already exists');
  }
}

export async function createCategory(input: CategoryInput) {
  await assertNameFree(input.name);

  return prisma.category.create({
    data: { name: input.name, slug: slugify(input.name) },
  });
}

export async function updateCategory(id: number, input: CategoryInput) {
  await getCategory(id);
  await assertNameFree(input.name, id);

  return prisma.category.update({
    where: { id },
    data: { name: input.name, slug: slugify(input.name) },
  });
}

export async function deleteCategory(id: number) {
  await getCategory(id);

  const products = await prisma.product.count({ where: { categoryId: id } });

  if (products > 0) {
    throw conflict('Category has products');
  }

  await prisma.category.delete({ where: { id } });
}
