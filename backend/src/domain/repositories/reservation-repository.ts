import { Reservation } from "../entities/reservation.js";

export type ReservationFilter = {
  status?: Reservation["status"];
  roomId?: string;
  from?: Date;
  to?: Date;
};

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findByRoomInTimeRange(roomId: string, startTime: Date, endTime: Date): Promise<Reservation[]>;
  findById(id: string): Promise<Reservation | null>;
  findByUserId(userId: string): Promise<Reservation[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<Reservation[]>;
  findAll(filter?: ReservationFilter): Promise<Reservation[]>;
}
