import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.vehicleBooking.deleteMany();
  console.log(`Deleted bookings: ${result.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


