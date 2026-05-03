import { Reservation } from "../entities/reservation.js";

export type ReservationFilter = {
  status?: Reservation["status"];
  roomId?: string;
  from?: Date;
  to?: Date;
};

export type CheckInMethod = "PIN" | "QR";

export type UpsertCheckInCodeInput = {
  reservationId: string;
  userId: string;
  pinHash: string;
  qrHash: string;
  expiresAt: Date;
};

export type VerifyCheckInCodeInput = {
  reservationId: string;
  userId: string;
  method: CheckInMethod;
  code: string;
  now: Date;
};

export type ConsumeCheckInCodeInput = VerifyCheckInCodeInput;

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findByRoomInTimeRange(roomId: string, startTime: Date, endTime: Date): Promise<Reservation[]>;
  findById(id: string): Promise<Reservation | null>;
  findByUserId(userId: string): Promise<Reservation[]>;
  findByTimeRange(startTime: Date, endTime: Date): Promise<Reservation[]>;
  findAll(filter?: ReservationFilter): Promise<Reservation[]>;
  upsertCheckInCode(input: UpsertCheckInCodeInput): Promise<void>;
  consumeCheckInCode(input: ConsumeCheckInCodeInput): Promise<boolean>;
}
