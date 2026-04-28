import { FastifyInstance } from "fastify";
import { CancelReservationUseCase } from "../../application/use-cases/cancel-reservation.use-case.js";
import { CreateReservationUseCase } from "../../application/use-cases/create-reservation.use-case.js";
import { ListMyReservationsUseCase } from "../../application/use-cases/list-my-reservations.use-case.js";
import { mapErrorToResponse } from "../http/map-error-to-response.js";
import { InMemoryReservationRepository } from "../../infrastructure/repositories/in-memory-reservation-repository.js";
import {
  CreateReservationBody,
  isCreateReservationBody,
  isInvalidDate
} from "./reservations-payload.js";
import { InvalidPayloadError } from "../../domain/errors/reservation-errors.js";

export const registerReservationsRoutes = (
  app: FastifyInstance,
  reservationRepository: InMemoryReservationRepository
): void => {
  const createReservationUseCase = new CreateReservationUseCase(reservationRepository);
  const cancelReservationUseCase = new CancelReservationUseCase(reservationRepository);
  const listMyReservationsUseCase = new ListMyReservationsUseCase(reservationRepository);

  app.post(
    "/reservations",
    {
      schema: {
        tags: ["reservations"],
        body: {
          type: "object",
          required: ["id", "roomId", "userId", "startTime", "endTime"],
          properties: {
            id: { type: "string" },
            roomId: { type: "string" },
            userId: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" }
          }
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              roomId: { type: "string" },
              userId: { type: "string" },
              startTime: { type: "string", format: "date-time" },
              endTime: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["ACTIVE", "CANCELLED", "COMPLETED"] }
            }
          },
          400: {
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
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async (request, reply) => {
    const body = request.body as Partial<CreateReservationBody>;

    try {
      if (!isCreateReservationBody(body)) {
        throw new InvalidPayloadError();
      }

      if (isInvalidDate(body.startTime) || isInvalidDate(body.endTime)) {
        throw new InvalidPayloadError();
      }

      const reservation = await createReservationUseCase.execute({
        id: body.id,
        roomId: body.roomId,
        userId: body.userId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime)
      });

      return reply.status(201).send(reservation);
    } catch (error) {
      const mapped = mapErrorToResponse(error);
      return reply
        .status(mapped.statusCode as 201 | 400 | 409 | 500)
        .send({ message: mapped.message });
    }
    }
  );

  app.get(
    "/reservations/me",
    {
      schema: {
        tags: ["reservations"],
        querystring: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" }
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
                status: { type: "string", enum: ["ACTIVE", "CANCELLED", "COMPLETED"] }
              }
            }
          }
        }
      }
    },
    async (request) => {
      const query = request.query as { userId: string };
      return listMyReservationsUseCase.execute({ userId: query.userId });
    }
  );

  app.delete(
    "/reservations/:id",
    {
      schema: {
        tags: ["reservations"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              roomId: { type: "string" },
              userId: { type: "string" },
              startTime: { type: "string", format: "date-time" },
              endTime: { type: "string", format: "date-time" },
              status: { type: "string", enum: ["ACTIVE", "CANCELLED", "COMPLETED"] }
            }
          },
          404: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          },
          500: {
            type: "object",
            properties: {
              message: { type: "string" }
            }
          }
        }
      }
    },
    async (request, reply) => {
    const params = request.params as { id: string };

    try {
      const reservation = await cancelReservationUseCase.execute({
        reservationId: params.id
      });

      return reply.status(200).send(reservation);
    } catch (error) {
      const mapped = mapErrorToResponse(error);
      return reply
        .status(mapped.statusCode as 200 | 404 | 500)
        .send({ message: mapped.message });
    }
    }
  );
};
