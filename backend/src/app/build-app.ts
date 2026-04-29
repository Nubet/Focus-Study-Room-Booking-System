import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { registerAdminRoutes } from "../modules/admin/api/routes/admin-routes.js";
import { registerRoomsRoutes } from "../modules/rooms/api/routes/rooms-routes.js";
import { registerReservationsRoutes } from "../modules/reservations/api/routes/reservations-routes.js";
import { RoomRepository } from "../modules/rooms/domain/repositories/room-repository.js";
import { ReservationRepository } from "../modules/reservations/domain/repositories/reservation-repository.js";
import { InMemoryRoomRepository } from "../modules/rooms/infrastructure/repositories/in-memory-room-repository.js";
import { InMemoryReservationRepository } from "../modules/reservations/infrastructure/repositories/in-memory-reservation-repository.js";

export const buildApp = (
  roomRepository: RoomRepository = new InMemoryRoomRepository(),
  reservationRepository: ReservationRepository = new InMemoryReservationRepository()
) => {
  const app = Fastify();

  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: "Focus Study Room Booking API",
        version: "0.1.0"
      }
    }
  });

  app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  app.register(async (instance) => {
    instance.get(
      "/health",
      {
        schema: {
          tags: ["system"],
          response: {
            200: {
              type: "object",
              properties: {
                status: { type: "string" }
              }
            }
          }
        }
      },
      async () => ({ status: "ok" })
    );

    registerReservationsRoutes(instance, reservationRepository);
    registerRoomsRoutes(instance, roomRepository, reservationRepository);
    registerAdminRoutes(instance, roomRepository, reservationRepository);
  });

  return app;
};
