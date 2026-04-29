export type Role = 'USER' | 'ADMIN'
export type View = 'BOOKING' | 'ROOMS' | 'MODERATOR'
export type BookingStep = 1 | 2 | 3

export type ReservationStatus =
  | 'RESERVED'
  | 'OCCUPIED'
  | 'NO_SHOW_RELEASED'
  | 'CANCELLED'
  | 'COMPLETED'

export type RoomStatusFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
export type RoomSort = 'ROOM_ASC' | 'ROOM_DESC' | 'BUILDING'

export type Room = {
  id: string
}

export type Reservation = {
  id: string
  roomId: string
  userId: string
  startTime: string
  endTime: string
  status: ReservationStatus
  checkedInAt?: string
}

export type ReservationFilter = {
  status: string
  roomId: string
  from: string
  to: string
}
