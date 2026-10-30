import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';
import { slugify } from '../src/lib/slug.js';

const catalog: Record<string, [name: string, priceCents: number, stock: number][]> = {
  Electronics: [
    ['Wireless Mouse', 1999, 50],
    ['Mechanical Keyboard', 8999, 25],
    ['USB-C Hub', 3499, 40],
    ['Noise Cancelling Headphones', 12999, 15],
    ['Webcam 1080p', 5999, 30],
  ],
  Books: [
    ['Clean Code', 3499, 20],
    ['The Pragmatic Programmer', 4299, 18],
    ['Designing Data-Intensive Applications', 5499, 12],
    ['Refactoring', 4799, 10],
    ['Node.js Design Patterns', 3999, 14],
  ],
  Home: [
    ['Desk Lamp', 2499, 35],
    ['Standing Desk Mat', 3999, 22],
    ['Ceramic Mug', 1299, 100],
    ['Water Bottle', 1899, 80],
    ['Cable Organizer', 899, 120],
  ],
  Accessories: [
    ['Laptop Sleeve', 2999, 45],
    ['Backpack', 6499, 28],
    ['Phone Stand', 1599, 60],
    ['Sticker Pack', 599, 200],
    ['Out of Stock Gadget', 4999, 0],
  ],
};

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin12345';

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  for (const [categoryName, products] of Object.entries(catalog)) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: {},
      create: { name: categoryName, slug: slugify(categoryName) },
    });

    for (const [name, priceCents, stock] of products) {
      await prisma.product.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: {
          name,
          slug: slugify(name),
          description: `${name} from the ${categoryName} collection.`,
          priceCents,
          stock,
          categoryId: category.id,
        },
      });
    }
  }
}

try {
  await main();
  console.log('Seed complete');
} finally {
  await prisma.$disconnect();
}
