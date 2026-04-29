import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "./app.js";
import { PrismaReservationRepository } from "./infrastructure/repositories/prisma-reservation-repository.js";
import { PrismaRoomRepository } from "./infrastructure/repositories/prisma-room-repository.js";

const start = async () => {
  const prisma = new PrismaClient();
  const roomRepository = new PrismaRoomRepository(prisma);
  const reservationRepository = new PrismaReservationRepository(prisma);

  const app = buildApp(roomRepository, reservationRepository);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  await app.listen({ port: 3001, host: "0.0.0.0" });
};

start();
