import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { plCampusBuildings } from "./campus-buildings.ts";

const prisma = new PrismaClient();

const ROOM_NUMBERS_POOL = [
  103, 127, 149, 162, 184, 207, 219, 238, 254,
  271, 289, 304, 327, 346, 358, 379, 392, 418,
  437, 453, 468, 482, 509, 523, 541, 566, 587,
  603, 624, 648, 671, 689, 702, 719, 736, 754,
  778, 793, 816, 839, 857, 872, 894, 913, 937
];

const ROOMS_PER_BUILDING = 5;

async function main() {
  console.log("Seeding database...");
  let poolIndex = 0;

  for (const building of plCampusBuildings) {
    await prisma.building.upsert({
      where: { code: building.code },
      update: { name: building.name },
      create: { code: building.code, name: building.name }
    });
  }

  for (const building of plCampusBuildings) {
    for (let i = 0; i < ROOMS_PER_BUILDING; i += 1) {
      const number = ROOM_NUMBERS_POOL[poolIndex];
      poolIndex += 1;

      const roomId = `${building.code}-${String(number).padStart(3, "0")}`;
      await prisma.room.upsert({
        where: { id: roomId },
        update: {},
        create: { id: roomId, buildingCode: building.code },
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
