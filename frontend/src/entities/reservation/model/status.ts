export type ReservationStatus =
  | 'RESERVED'
  | 'OCCUPIED'
  | 'NO_SHOW_RELEASED'
  | 'CANCELLED'
  | 'COMPLETED'

export const RESERVATION_STATUSES: ReservationStatus[] = [
  'RESERVED',
  'OCCUPIED',
  'NO_SHOW_RELEASED',
  'CANCELLED',
  'COMPLETED'
]

const reservationStatuses = new Set<string>(RESERVATION_STATUSES)

export function isReservationStatus(value: string): value is ReservationStatus {
  return reservationStatuses.has(value)
}
