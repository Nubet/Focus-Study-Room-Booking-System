export type ReservationStatus =
  | 'RESERVED'
  | 'OCCUPIED'
  | 'NO_SHOW_RELEASED'
  | 'CANCELLED'
  | 'COMPLETED'

const reservationStatuses = new Set<string>([
  'RESERVED',
  'OCCUPIED',
  'NO_SHOW_RELEASED',
  'CANCELLED',
  'COMPLETED'
])

export function isReservationStatus(value: string): value is ReservationStatus {
  return reservationStatuses.has(value)
}
