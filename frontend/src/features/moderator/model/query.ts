import type { ModeratorReservationFilter } from './reservationFilter'

export function buildReservationsQuerySuffix(filter: ModeratorReservationFilter): string {
  const query = new URLSearchParams()

  if (filter.status) query.set('status', filter.status)
  if (filter.roomId) query.set('roomId', filter.roomId)
  if (filter.from) query.set('from', new Date(filter.from).toISOString())
  if (filter.to) query.set('to', new Date(filter.to).toISOString())

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}
