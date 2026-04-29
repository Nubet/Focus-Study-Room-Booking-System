import { FastifyInstance } from "fastify";
import { ReservationStatus } from "../../domain/entities/reservation.js";
import { InMemoryRoomRepository } from "../../infrastructure/repositories/in-memory-room-repository.js";
import { InMemoryReservationRepository } from "../../infrastructure/repositories/in-memory-reservation-repository.js";
import { isNonEmptyString, isValidDateString } from "./query-validators.js";

const isAdminRole = (value: unknown): boolean => value === "ADMIN";

const ensureAdmin = (role: unknown): boolean => isAdminRole(role);

const isReservationStatus = (value: unknown): value is ReservationStatus => {
  return (
    value === "RESERVED" ||
    value === "OCCUPIED" ||
    value === "NO_SHOW_RELEASED" ||
    value === "CANCELLED" ||
    value === "COMPLETED"
  );
};

const isAllowedReservationTransition = (
  currentStatus: ReservationStatus,
  nextStatus: ReservationStatus
): boolean => {
  const transitions: Record<ReservationStatus, ReservationStatus[]> = {
    RESERVED: ["OCCUPIED", "CANCELLED", "NO_SHOW_RELEASED", "COMPLETED"],
    OCCUPIED: ["COMPLETED", "CANCELLED"],
    NO_SHOW_RELEASED: [],
    CANCELLED: [],
    COMPLETED: []
  };

  return transitions[currentStatus].includes(nextStatus);
};

export const registerAdminRoutes = (
  app: FastifyInstance,
  roomRepository: InMemoryRoomRepository,
  reservationRepository: InMemoryReservationRepository
): void => {
  const preValidateAdmin = async (request: any, reply: any) => {
    if (!ensureAdmin(request.headers["x-role"])) {
      return reply.status(403).send({ message: "Forbidden" });
    }
  };

  app.get(
    "/admin/rooms",
    {
      preValidation: preValidateAdmin,
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
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      const rooms = await roomRepository.findAll();
      return reply.status(200).send(rooms);
    }
  );

  app.post(
    "/admin/rooms",
    {
      preValidation: preValidateAdmin,
      schema: {
        tags: ["admin"],
        body: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", minLength: 1 }
          },
          examples: [{ id: "room-z" }]
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
      const body = request.body as { id?: string };

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
      preValidation: preValidateAdmin,
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
          },
          examples: [{ id: "room-z-updated" }]
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
      const params = request.params as { id?: string };
      const body = request.body as { id?: string };

      if (!isNonEmptyString(params.id) || !isNonEmptyString(body.id)) {
        return reply.status(400).send({ message: "Invalid payload" });
      }

      if (params.id !== body.id) {
        const duplicate = await roomRepository.findById(body.id);

        if (duplicate) {
          return reply.status(409).send({ message: "Room already exists" });
        }
      }

      const updated = await roomRepository.updateId(params.id, body.id);

      if (!updated) {
        return reply.status(404).send({ message: "Room not found" });
      }

      return reply.status(200).send(updated);
    }
  );

  app.delete(
    "/admin/rooms/:id",
    {
      preValidation: preValidateAdmin,
      schema: {
        tags: ["admin"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" }
          }
        },
        response: {
          204: {
            type: "null"
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
      const params = request.params as { id?: string };

      if (!isNonEmptyString(params.id)) {
        return reply.status(404).send({ message: "Room not found" });
      }

      const deleted = await roomRepository.deleteById(params.id);

      if (!deleted) {
        return reply.status(404).send({ message: "Room not found" });
      }

      return reply.status(204).send();
    }
  );

  app.get(
    "/admin/reservations",
    {
      preValidation: preValidateAdmin,
      schema: {
        tags: ["admin"],
        querystring: {
          type: "object",
          properties: {
            roomId: { type: "string" },
            from: { type: "string", format: "date-time" },
            to: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["RESERVED", "OCCUPIED", "NO_SHOW_RELEASED", "CANCELLED", "COMPLETED"]
            }
          }
        },
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                roomId: { type: "string" },
                userId: { type: "string" },
                startTime: { type: "string", format: "date-time" },
                endTime: { type: "string", format: "date-time" },
                status: {
                  type: "string",
                  enum: ["RESERVED", "OCCUPIED", "NO_SHOW_RELEASED", "CANCELLED", "COMPLETED"]
                }
              }
            }
          },
          403: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          400: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const query = request.query as {
        status?: "RESERVED" | "OCCUPIED" | "NO_SHOW_RELEASED" | "CANCELLED" | "COMPLETED";
        roomId?: string;
        from?: string;
        to?: string;
      };

      if (query.from && !isValidDateString(query.from)) {
        return reply.status(400).send({ message: "Invalid query" });
      }

      if (query.to && !isValidDateString(query.to)) {
        return reply.status(400).send({ message: "Invalid query" });
      }

      const filteredReservations = await reservationRepository.findAll({
        status: query.status,
        roomId: query.roomId,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined
      });
      return reply.status(200).send(filteredReservations);
    }
  );

  app.patch(
    "/admin/reservations/:id/status",
    {
      preValidation: preValidateAdmin,
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
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["RESERVED", "OCCUPIED", "NO_SHOW_RELEASED", "CANCELLED", "COMPLETED"]
            }
          },
          examples: [{ status: "COMPLETED" }]
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: {
                type: "string",
                enum: ["RESERVED", "OCCUPIED", "NO_SHOW_RELEASED", "CANCELLED", "COMPLETED"]
              }
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
      const params = request.params as { id?: string };
      const body = request.body as { status?: string };

      if (!isNonEmptyString(params.id) || !isReservationStatus(body.status)) {
        return reply.status(400).send({ message: "Invalid payload" });
      }

      const reservation = await reservationRepository.findById(params.id);

      if (!reservation) {
        return reply.status(404).send({ message: "Reservation not found" });
      }

      if (!isAllowedReservationTransition(reservation.status, body.status)) {
        return reply.status(409).send({ message: "Invalid reservation status transition" });
      }

      reservation.status = body.status;
      await reservationRepository.save(reservation);

      return reply.status(200).send({ id: reservation.id, status: reservation.status });
    }
  );
};
