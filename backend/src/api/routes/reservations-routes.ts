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

  app.post("/reservations", async (request, reply) => {
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
      return reply.status(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get("/reservations/me", async (request) => {
    const query = request.query as { userId: string };
    return listMyReservationsUseCase.execute({ userId: query.userId });
  });

  app.delete("/reservations/:id", async (request, reply) => {
    const params = request.params as { id: string };

    try {
      const reservation = await cancelReservationUseCase.execute({
        reservationId: params.id
      });

      return reply.status(200).send(reservation);
    } catch (error) {
      const mapped = mapErrorToResponse(error);
      return reply.status(mapped.statusCode).send({ message: mapped.message });
    }
  });
};
