import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Traditional Necklaces", "necklaces"],
  ["Earrings", "earrings"],
  ["Bridal Collection", "bridal"],
  ["Jonbiri", "jonbiri"],
  ["Gamkharu", "gamkharu"],
  ["Lokaparo", "lokaparo"]
];

const adminEmail = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "";

const products = [
  ["p1", "Royal Jonbiri Bridal Necklace", "royal-jonbiri-bridal-necklace", "Jonbiri", 5499, 6999, 14, true, false],
  ["p2", "Gamkharu Heritage Bangle Pair", "gamkharu-heritage-bangle-pair", "Gamkharu", 3299, 3999, 21, true, false],
  ["p3", "Lokaparo Gold Drop Earrings", "lokaparo-gold-drop-earrings", "Lokaparo", 1699, 2199, 36, false, true],
  ["p4", "Assamese Bridal Layered Set", "assamese-bridal-layered-set", "Bridal Collection", 8999, 10999, 8, true, false],
  ["p5", "Festival Kemp Necklace", "festival-kemp-necklace", "Traditional Necklaces", 2499, null, 25, false, true],
  ["p6", "Everyday Pearl Japi Studs", "everyday-pearl-japi-studs", "Earrings", 999, null, 54, false, true]
];

async function main() {
  for (const [name, slug] of categories) {
    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: {
        name,
        slug,
        description: `${name} by Monimala Store`,
        image: "/images/monimala-hero.png"
      }
    });
  }

  for (const product of products) {
    const [id, name, slug, categoryName, price, compareAt, stock, isFeatured, isNew] = product;
    const category = await prisma.category.findFirstOrThrow({
      where: { name: String(categoryName) }
    });

    await prisma.product.upsert({
      where: { slug: String(slug) },
      update: {
        name: String(name),
        price: Number(price),
        compareAt: compareAt === null ? null : Number(compareAt),
        stock: Number(stock),
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        categoryId: category.id
      },
      create: {
        id: String(id),
        name: String(name),
        slug: String(slug),
        sku: `MONI-${String(id).toUpperCase()}`,
        description: `${name} with premium Assamese heritage styling.`,
        price: Number(price),
        compareAt: compareAt === null ? null : Number(compareAt),
        stock: Number(stock),
        images: JSON.stringify(["/images/monimala-hero.png"]),
        metal: "Gold Finish",
        occasion: String(categoryName).includes("Bridal") ? "Bridal" : "Heritage",
        isFeatured: Boolean(isFeatured),
        isNew: Boolean(isNew),
        categoryId: category.id
      }
    });
  }

  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: { name: process.env.SEED_ADMIN_NAME || "Monimala Admin", email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: "ADMIN" }
    });
  } else {
    console.warn("Admin not seeded. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD explicitly.");
  }

  await prisma.coupon.upsert({
    where: { code: "BIHU10" },
    update: {},
    create: { code: "BIHU10", percent: 10, active: true }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
