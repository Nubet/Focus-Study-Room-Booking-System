import { request } from '../../../shared/api/httpClient'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { ReservationStatus } from '../../../entities/reservation/model/status'
import type { Room } from '../../../entities/room/model/types'

export const moderatorApi = {
  createRoom: (id: string, headers: HeadersInit) =>
    request<Room>('/admin/rooms', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id })
    }),
  renameRoom: (sourceId: string, targetId: string, headers: HeadersInit) =>
    request<Room>(`/admin/rooms/${sourceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: targetId })
    }),
  deleteRoom: (id: string, headers: HeadersInit) =>
    request<void>(`/admin/rooms/${id}`, {
      method: 'DELETE',
      headers
    }),
  getReservations: (suffix: string, headers: HeadersInit) =>
    request<Reservation[]>(`/admin/reservations${suffix}`, { headers }),
  updateReservationStatus: (reservationId: string, status: ReservationStatus, headers: HeadersInit) =>
    request<{ id: string; status: ReservationStatus }>(`/admin/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    })
}
