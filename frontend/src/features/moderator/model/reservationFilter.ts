export type ModeratorReservationFilter = {
  status: string
  roomId: string
  from: string
  to: string
}

export const EMPTY_MODERATOR_RESERVATION_FILTER: ModeratorReservationFilter = {
  status: '',
  roomId: '',
  from: '',
  to: ''
}
