import { Reservation } from "../../domain/entities/reservation.js";

export class InMemoryReservationRepository {
  private readonly items = new Map<string, Reservation>();

  private isBlockingStatus(status: Reservation["status"]): boolean {
    return status === "RESERVED" || status === "OCCUPIED";
  }

  async save(reservation: Reservation): Promise<void> {
    this.items.set(reservation.id, reservation);
  }

  async findByRoomInTimeRange(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter(
      (item) =>
        item.roomId === roomId &&
        this.isBlockingStatus(item.status) &&
        item.startTime < endTime &&
        item.endTime > startTime
    );
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.items.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter((item) => item.userId === userId);
  }

  async findByTimeRange(startTime: Date, endTime: Date): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter(
      (item) =>
        this.isBlockingStatus(item.status) && item.startTime < endTime && item.endTime > startTime
    );
  }
}
