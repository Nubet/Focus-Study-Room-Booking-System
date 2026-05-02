import type { Building } from '@/entities/building/model/types'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { Room } from '../../../entities/room/model/types'
import { request } from '../../../shared/api/httpClient'

export const roomsApi = {
  getBuildings: () => request<Building[]>('/buildings'),
  getAllRooms: (headers: HeadersInit) => request<Room[]>('/admin/rooms', { headers }),
  getAvailableRooms: (startTime: string, endTime: string) =>
    request<Room[]>(`/rooms/available?startTime=${startTime}&endTime=${endTime}`),
  getMyReservations: (userId: string) =>
    request<Reservation[]>(`/reservations/me?userId=${encodeURIComponent(userId)}`)
}
