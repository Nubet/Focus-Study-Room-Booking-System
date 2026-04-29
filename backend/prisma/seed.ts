import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plCampusBuildings = [
  { code: 'A1', name: 'International Faculty of Engineering' },
  { code: 'A2', name: 'Faculty of Biotechnology and Food Sciences' },
  { code: 'A3', name: 'Department of Environmental Biotechnology' },
  { code: 'A4', name: 'Faculty of Biotechnology and Food Sciences - Dean Office' },
  { code: 'A6', name: 'Faculty of Process and Environmental Engineering' },
  { code: 'A8', name: 'Institute of General and Ecological Chemistry' },
  { code: 'A10', name: 'Faculty of Electrical, Electronic, Computer and Control Engineering' },
  { code: 'A11', name: 'Institute of Electrical Power Engineering' },
  { code: 'A12', name: 'Faculty of Electrical, Electronic, Computer and Control Engineering' },
  { code: 'A18', name: 'Engineers Factory XXI' },
  { code: 'A21', name: 'Faculty of Mechanical Engineering' },
  { code: 'A24', name: 'Faculty of Chemistry' },
  { code: 'A33', name: 'Faculty of Material Technologies and Textile Design' },
  { code: 'A34', name: 'Alchemium - Faculty of Chemistry' }
];

async function main() {
  console.log("Seeding database...");
  for (const building of plCampusBuildings) {
    for (const num of [10, 20, 30]) {
      const roomId = `${building.code}-${num}`;
      await prisma.room.upsert({
        where: { id: roomId },
        update: {},
        create: { id: roomId },
      });
      console.log(`Upserted room ${roomId}`);
    }
  }
  console.log("Seeding finished.");
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
