import { FastifyInstance } from "fastify";
import { ListAvailableRoomsUseCase } from "../../application/use-cases/list-available-rooms.use-case.js";
import { InMemoryReservationRepository } from "../../infrastructure/repositories/in-memory-reservation-repository.js";
import { InMemoryRoomRepository } from "../../infrastructure/repositories/in-memory-room-repository.js";
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

    if (typeof query.startTime !== "string" || typeof query.endTime !== "string") {
      return reply.status(400).send({ message: "Invalid query" });
    }

    if (isInvalidDate(query.startTime) || isInvalidDate(query.endTime)) {
      return reply.status(400).send({ message: "Invalid query" });
    }

    const rooms = await listAvailableRoomsUseCase.execute({
      startTime: new Date(query.startTime),
      endTime: new Date(query.endTime)
    });

    return reply.status(200).send(rooms);
  });
};
