import "dotenv/config";
import { seedDatabase } from "../lib/seed";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱  Seeding Agent Market...");
  const summary = await seedDatabase();
  console.log("✅  Seed complete:", summary);
}

main()
  .catch((error) => {
    console.error("❌  Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
