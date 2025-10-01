import { PrismaClient, Role, ModuleKey } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Temiz başlangıç (dev ortamı için)
  await prisma.collection.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.moduleSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const t1 = await prisma.tenant.create({ data: { name: "Acente A" } });
  const t2 = await prisma.tenant.create({ data: { name: "Acente B" } });

  const defaults = Object.values(ModuleKey).map((key) => ({ key, enabled: true }));
  await prisma.moduleSetting.createMany({ data: defaults.map((d) => ({ ...d, tenantId: t1.id })) });
  await prisma.moduleSetting.createMany({ data: defaults.map((d) => ({ ...d, tenantId: t2.id })) });

  await prisma.user.create({ data: { email: "super@example.com", password: "demodemo", role: Role.SUPER } });
  await prisma.user.create({ data: { email: "admin@example.com", password: "demodemo", role: Role.ADMIN, tenantId: t1.id } });

  await prisma.policy.createMany({
    data: [
      { tenantId: t1.id, number: "P-1001", holder: "Ali Veli", premium: 1200 },
      { tenantId: t1.id, number: "P-1002", holder: "Ayşe Fatma", premium: 950 },
    ],
  });

  await prisma.offer.createMany({
    data: [
      { tenantId: t1.id, title: "Kasko Teklifi", amount: 3500, status: "Beklemede" },
      { tenantId: t1.id, title: "Trafik Sigortası Teklifi", amount: 1200, status: "Onaylandı" },
    ],
  });

  await prisma.collection.createMany({
    data: [
      { tenantId: t1.id, amount: 1500, note: "Nakit" },
      { tenantId: t1.id, amount: 2200, note: "Havale" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


