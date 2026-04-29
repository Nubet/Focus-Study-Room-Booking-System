import type { ReservationStatus } from './status'

export type Reservation = {
  id: string
  roomId: string
  userId: string
  startTime: string
  endTime: string
  status: ReservationStatus
  checkedInAt?: string
}
