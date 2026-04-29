import { FastifyInstance } from "fastify";
import { InMemoryRoomRepository } from "../../infrastructure/repositories/in-memory-room-repository.js";

const isAdminRole = (value: unknown): boolean => value === "ADMIN";

export const registerAdminRoutes = (
  app: FastifyInstance,
  roomRepository: InMemoryRoomRepository
): void => {
  app.get(
    "/admin/rooms",
    {
      schema: {
        tags: ["admin"],
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" }
              }
            }
          },
          403: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const role = request.headers["x-role"];

      if (!isAdminRole(role)) {
        return reply.status(403).send({ message: "Forbidden" });
      }

      const rooms = await roomRepository.findAll();
      return reply.status(200).send(rooms);
    }
  );
};
