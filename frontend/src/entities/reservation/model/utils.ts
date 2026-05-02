import type { Reservation } from './types'

const blockingStatuses = new Set(['RESERVED', 'OCCUPIED'])

export function isBlockingReservation(status: string): boolean {
  return blockingStatuses.has(status)
}

export function isTimeRangeOverlapping(
  reservationStartTime: string,
  reservationEndTime: string,
  rangeStartTime: string,
  rangeEndTime: string
): boolean {
  return new Date(reservationStartTime) < new Date(rangeEndTime) && new Date(reservationEndTime) > new Date(rangeStartTime)
}

export function getBookedRoomIdsForRange(
  reservations: Reservation[],
  rangeStartTime: string,
  rangeEndTime: string
): string[] {
  return reservations
    .filter((reservation) => isBlockingReservation(reservation.status))
    .filter((reservation) =>
      isTimeRangeOverlapping(reservation.startTime, reservation.endTime, rangeStartTime, rangeEndTime)
    )
    .map((reservation) => reservation.roomId)
}
