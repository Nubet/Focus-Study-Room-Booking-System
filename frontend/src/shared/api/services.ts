import { request } from './httpClient'
import type { Reservation } from '../../entities/reservation/model/types'
import type { ReservationStatus } from '../../entities/reservation/model/status'
import type { Room } from '../../entities/room/model/types'

export const roomsService = {
  getAll: (headers: HeadersInit) => request<Room[]>('/admin/rooms', { headers }),
  getAvailable: (startTime: string, endTime: string) =>
    request<Room[]>(`/rooms/available?startTime=${startTime}&endTime=${endTime}`),
  create: (id: string, headers: HeadersInit) =>
    request<Room>('/admin/rooms', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id })
    }),
  rename: (sourceId: string, targetId: string, headers: HeadersInit) =>
    request<Room>(`/admin/rooms/${sourceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id: targetId })
    }),
  delete: (id: string, headers: HeadersInit) =>
    request<void>(`/admin/rooms/${id}`, {
      method: 'DELETE',
      headers
    })
}

export const reservationsService = {
  create: (payload: {
    id: string
    roomId: string
    userId: string
    startTime: string
    endTime: string
  }) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getMine: (userId: string) => request<Reservation[]>(`/reservations/me?userId=${encodeURIComponent(userId)}`),
  getAllAdmin: (suffix: string, headers: HeadersInit) =>
    request<Reservation[]>(`/admin/reservations${suffix}`, { headers }),
  updateStatus: (reservationId: string, status: ReservationStatus, headers: HeadersInit) =>
    request<{ id: string; status: ReservationStatus }>(`/admin/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    })
}
