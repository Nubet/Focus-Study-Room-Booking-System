import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { registerAdminRoutes } from "./api/routes/admin-routes.js";
import { registerRoomsRoutes } from "./api/routes/rooms-routes.js";
import { registerReservationsRoutes } from "./api/routes/reservations-routes.js";
import { InMemoryReservationRepository } from "./infrastructure/repositories/in-memory-reservation-repository.js";
import { InMemoryRoomRepository } from "./infrastructure/repositories/in-memory-room-repository.js";

export const buildApp = () => {
  const app = Fastify();
  const reservationRepository = new InMemoryReservationRepository();
  const roomRepository = new InMemoryRoomRepository();

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
