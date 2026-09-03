// Verify existing order numbers in the DB after the new generator.
// Run with: bun /home/z/my-project/scripts/check-orders.ts
import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  const recent = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { orderNumber: true, createdAt: true },
  });
  console.log("Recent orders:");
  for (const o of recent) {
    console.log(`  ${o.orderNumber}  (created ${o.createdAt.toISOString()})`);
  }

  // Also: today's count
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(today.getUTCDate()).padStart(2, "0");
  const todayPrefix = `GP-${yyyy}${mm}${dd}-`;
  const todays = await db.order.count({
    where: { orderNumber: { startsWith: todayPrefix } },
  });
  console.log(`\nToday's orders (${todayPrefix}XXXX): ${todays}`);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
