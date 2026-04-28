import { InvalidReservationTimeError } from "../errors/reservation-errors.js";

export type ReservationStatus =
  | "RESERVED"
  | "OCCUPIED"
  | "NO_SHOW_RELEASED"
  | "CANCELLED"
  | "COMPLETED";

type CreateReservationInput = {
  id: string;
  roomId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
};

export class Reservation {
  readonly id: string;
  readonly roomId: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  status: ReservationStatus;

  private constructor(input: CreateReservationInput) {
    this.id = input.id;
    this.roomId = input.roomId;
    this.userId = input.userId;
    this.startTime = input.startTime;
    this.endTime = input.endTime;
    this.status = "RESERVED";
  }

  static create(input: CreateReservationInput): Reservation {
    if (input.startTime >= input.endTime) {
      throw new InvalidReservationTimeError();
    }

    return new Reservation(input);
  }

  cancel(): void {
    this.status = "CANCELLED";
  }

  markOccupied(): void {
    this.status = "OCCUPIED";
  }

  markNoShowReleased(): void {
    this.status = "NO_SHOW_RELEASED";
  }

  markCompleted(): void {
    this.status = "COMPLETED";
  }
}
