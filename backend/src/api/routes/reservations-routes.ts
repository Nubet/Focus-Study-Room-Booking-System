import { FastifyInstance } from "fastify";
import { CancelReservationUseCase } from "../../application/use-cases/cancel-reservation.use-case.js";
import { CreateReservationUseCase } from "../../application/use-cases/create-reservation.use-case.js";
import { ListMyReservationsUseCase } from "../../application/use-cases/list-my-reservations.use-case.js";
import { InMemoryReservationRepository } from "../../infrastructure/repositories/in-memory-reservation-repository.js";

export const registerReservationsRoutes = (app: FastifyInstance): void => {
  const reservationRepository = new InMemoryReservationRepository();
  const createReservationUseCase = new CreateReservationUseCase(reservationRepository);
  const cancelReservationUseCase = new CancelReservationUseCase(reservationRepository);
  const listMyReservationsUseCase = new ListMyReservationsUseCase(reservationRepository);

  app.post("/reservations", async (request, reply) => {
    const body = request.body as {
      id: string;
      roomId: string;
      userId: string;
      startTime: string;
      endTime: string;
    };

    try {
      const reservation = await createReservationUseCase.execute({
        id: body.id,
        roomId: body.roomId,
        userId: body.userId,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime)
      });

      return reply.status(201).send(reservation);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";

      if (message === "Slot already reserved") {
        return reply.status(409).send({ message });
      }

      return reply.status(400).send({ message });
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
      const message = error instanceof Error ? error.message : "Unexpected error";

      if (message === "Reservation not found") {
        return reply.status(404).send({ message });
      }

      return reply.status(400).send({ message });
    }
  });
};
