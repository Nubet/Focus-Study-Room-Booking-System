import { FastifyInstance } from "fastify";
import { ListAvailableRoomsUseCase } from "../../application/use-cases/list-available-rooms.use-case.js";
import { InvalidQueryError } from "../../domain/errors/reservation-errors.js";
import { InMemoryReservationRepository } from "../../infrastructure/repositories/in-memory-reservation-repository.js";
import { InMemoryRoomRepository } from "../../infrastructure/repositories/in-memory-room-repository.js";
import { mapErrorToResponse } from "../http/map-error-to-response.js";
import { isInvalidDate } from "./reservations-payload.js";

export const registerRoomsRoutes = (
  app: FastifyInstance,
  roomRepository: InMemoryRoomRepository,
  reservationRepository: InMemoryReservationRepository
): void => {
  const listAvailableRoomsUseCase = new ListAvailableRoomsUseCase(
    roomRepository,
    reservationRepository
  );

  app.get("/rooms/available", async (request, reply) => {
    const query = request.query as { startTime?: string; endTime?: string };

    try {
      if (typeof query.startTime !== "string" || typeof query.endTime !== "string") {
        throw new InvalidQueryError();
      }

      if (isInvalidDate(query.startTime) || isInvalidDate(query.endTime)) {
        throw new InvalidQueryError();
      }

      const rooms = await listAvailableRoomsUseCase.execute({
        startTime: new Date(query.startTime),
        endTime: new Date(query.endTime)
      });

      return reply.status(200).send(rooms);
    } catch (error) {
      const mapped = mapErrorToResponse(error);
      return reply.status(mapped.statusCode).send({ message: mapped.message });
    }
  });
};
