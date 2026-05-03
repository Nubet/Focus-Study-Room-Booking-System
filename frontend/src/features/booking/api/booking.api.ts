import { request } from '../../../shared/api/httpClient'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { CreateReservationRequest } from '../model/types'

export type ReservationAccessCodes = {
  reservationId: string
  pin: string
  qrPayload: string
  expiresAt: string
}

export const bookingApi = {
  createReservation: (payload: CreateReservationRequest) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMyReservations: (userId: string) =>
    request<Reservation[]>(`/reservations/me?userId=${encodeURIComponent(userId)}`),
  cancelReservation: (reservationId: string) =>
    request<Reservation>(`/reservations/${encodeURIComponent(reservationId)}`, {
      method: 'DELETE'
    }),
  getAccessCodes: (reservationId: string, userId: string) =>
    request<ReservationAccessCodes>(`/reservations/${encodeURIComponent(reservationId)}/access-codes`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    })
}
