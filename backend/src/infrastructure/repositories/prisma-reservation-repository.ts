import { PrismaClient } from "@prisma/client";
import { Reservation, ReservationStatus } from "../../domain/entities/reservation.js";


import { ReservationRepository, ReservationFilter } from "../../domain/repositories/reservation-repository.js";

export class PrismaReservationRepository implements ReservationRepository  {
  constructor(private readonly prisma: PrismaClient) {}

  private isBlockingStatus(status: Reservation["status"]): boolean {
    return status === "RESERVED" || status === "OCCUPIED";
  }

  private toDomain(model: any): Reservation {
    const res = Reservation.create({
      id: model.id,
      roomId: model.roomId,
      userId: model.userId,
      startTime: model.startTime,
      endTime: model.endTime,
    });
    res.status = model.status as ReservationStatus;
    if (model.checkedInAt) {
      res.checkedInAt = model.checkedInAt;
    }
    return res;
  }

  async save(reservation: Reservation): Promise<void> {
    await this.prisma.reservation.upsert({
      where: { id: reservation.id },
      update: {
        roomId: reservation.roomId,
        userId: reservation.userId,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        checkedInAt: reservation.checkedInAt,
      },
      create: {
        id: reservation.id,
        roomId: reservation.roomId,
        userId: reservation.userId,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        checkedInAt: reservation.checkedInAt,
      },
    });
  }

  async findByRoomInTimeRange(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Reservation[]> {
    const models = await this.prisma.reservation.findMany({
      where: {
        roomId,
        status: { in: ["RESERVED", "OCCUPIED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    return models.map(this.toDomain);
  }

  async findById(id: string): Promise<Reservation | null> {
    const model = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!model) return null;
    return this.toDomain(model);
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    const models = await this.prisma.reservation.findMany({
      where: { userId },
    });
    return models.map(this.toDomain);
  }

  async findByTimeRange(startTime: Date, endTime: Date): Promise<Reservation[]> {
    const models = await this.prisma.reservation.findMany({
      where: {
        status: { in: ["RESERVED", "OCCUPIED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    return models.map(this.toDomain);
  }

  async findAll(filter: ReservationFilter = {}): Promise<Reservation[]> {
    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.roomId) {
      where.roomId = filter.roomId;
    }
    if (filter.from || filter.to) {
      if (filter.from && filter.to) {
        where.AND = [
          { startTime: { gte: filter.from } },
          { endTime: { lte: filter.to } },
        ];
      } else if (filter.from) {
        where.startTime = { gte: filter.from };
      } else if (filter.to) {
        where.endTime = { lte: filter.to };
      }
    }

    const models = await this.prisma.reservation.findMany({ where });
    return models.map(this.toDomain);
  }
}
