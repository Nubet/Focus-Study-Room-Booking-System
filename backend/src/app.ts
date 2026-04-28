import Fastify from "fastify";
import { registerRoomsRoutes } from "./api/routes/rooms-routes.js";
import { registerReservationsRoutes } from "./api/routes/reservations-routes.js";
import { InMemoryReservationRepository } from "./infrastructure/repositories/in-memory-reservation-repository.js";
import { InMemoryRoomRepository } from "./infrastructure/repositories/in-memory-room-repository.js";

export const buildApp = () => {
  const app = Fastify();
  const reservationRepository = new InMemoryReservationRepository();
  const roomRepository = new InMemoryRoomRepository();

  app.get("/health", async () => ({ status: "ok" }));
  registerReservationsRoutes(app, reservationRepository);
  registerRoomsRoutes(app, roomRepository, reservationRepository);

  return app;
};
