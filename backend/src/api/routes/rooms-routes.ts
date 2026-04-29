import { FastifyInstance } from "fastify";
import { ListAvailableRoomsUseCase } from "../../application/use-cases/list-available-rooms.use-case.js";
import { InvalidQueryError } from "../../domain/errors/reservation-errors.js";
import { ReservationRepository } from "../../domain/repositories/reservation-repository.js";
import { RoomRepository } from "../../domain/repositories/room-repository.js";
import { mapErrorToResponse } from "../http/map-error-to-response.js";
import { isValidDateString } from "./query-validators.js";

export const registerRoomsRoutes = (
  app: FastifyInstance,
  roomRepository: RoomRepository,
  reservationRepository: ReservationRepository
): void => {
  const listAvailableRoomsUseCase = new ListAvailableRoomsUseCase(
    roomRepository,
    reservationRepository
  );

  app.get(
    "/rooms/available",
    {
      schema: {
        tags: ["rooms"],
        querystring: {
          type: "object",
          required: ["startTime", "endTime"],
          properties: {
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" }
          }
        },
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
          400: {
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
      const query = request.query as { startTime?: string; endTime?: string };

      try {
        if (!isValidDateString(query.startTime) || !isValidDateString(query.endTime)) {
          throw new InvalidQueryError();
        }

        const startTime = new Date(query.startTime);
        const endTime = new Date(query.endTime);

        if (startTime >= endTime) {
          throw new InvalidQueryError();
        }

        const rooms = await listAvailableRoomsUseCase.execute({
          startTime,
          endTime
        });

        return reply.status(200).send(rooms);
      } catch (error) {
        const mapped = mapErrorToResponse(error);
        return reply
          .status(mapped.statusCode as 200 | 400 | 500)
          .send({ message: mapped.message });
      }
    }
  );
};
