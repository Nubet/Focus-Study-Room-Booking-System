import { FastifyInstance } from "fastify";
import { InMemoryRoomRepository } from "../../infrastructure/repositories/in-memory-room-repository.js";
import { isNonEmptyString } from "./query-validators.js";

const isAdminRole = (value: unknown): boolean => value === "ADMIN";

const ensureAdmin = (role: unknown): boolean => isAdminRole(role);

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

      if (!ensureAdmin(role)) {
        return reply.status(403).send({ message: "Forbidden" });
      }

      const rooms = await roomRepository.findAll();
      return reply.status(200).send(rooms);
    }
  );

  app.post(
    "/admin/rooms",
    {
      schema: {
        tags: ["admin"],
        body: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 }
          }
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          403: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          409: {
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
      const body = request.body as { id?: string };

      if (!ensureAdmin(role)) {
        return reply.status(403).send({ message: "Forbidden" });
      }

      if (!isNonEmptyString(body.id)) {
        return reply.status(400).send({ message: "Invalid payload" });
      }

      const existing = await roomRepository.findById(body.id);
      if (existing) {
        return reply.status(409).send({ message: "Room already exists" });
      }

      const room = { id: body.id };
      await roomRepository.save(room);

      return reply.status(201).send(room);
    }
  );

  app.patch(
    "/admin/rooms/:id",
    {
      schema: {
        tags: ["admin"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" }
          }
        },
        body: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          403: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          404: {
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
      const params = request.params as { id?: string };
      const body = request.body as { id?: string };

      if (!ensureAdmin(role)) {
        return reply.status(403).send({ message: "Forbidden" });
      }

      if (!isNonEmptyString(params.id) || !isNonEmptyString(body.id)) {
        return reply.status(400).send({ message: "Invalid payload" });
      }

      const updated = await roomRepository.updateId(params.id, body.id);

      if (!updated) {
        return reply.status(404).send({ message: "Room not found" });
      }

      return reply.status(200).send(updated);
    }
  );
};
