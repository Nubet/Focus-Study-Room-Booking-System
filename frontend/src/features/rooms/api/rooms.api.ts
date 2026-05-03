import type { Building } from '@/entities/building/model/types'
import type { Reservation } from '@/entities/reservation/model/types.ts'
import type { Room } from '@/entities/room/model/types.ts'
import { request } from '@/shared/api/httpClient.ts'
import { buildReservationsQuerySuffix } from '@/features/moderator/model/query'

export const roomsApi = {
  getBuildings: () => request<Building[]>('/buildings'),
  getAllRooms: (headers: HeadersInit) => request<Room[]>('/admin/rooms', { headers }),
  getAvailableRooms: (startTime: string, endTime: string) =>
    request<Room[]>(`/rooms/available?startTime=${startTime}&endTime=${endTime}`),
  getRoomReservationsForRange: (input: { roomId: string; from: string; to: string }, headers: HeadersInit) =>
    request<Reservation[]>(
      `/admin/reservations${buildReservationsQuerySuffix({
        status: '',
        roomId: input.roomId,
        from: input.from,
        to: input.to
      })}`,
      { headers }
    ),
  getMyReservations: (userId: string) =>
    request<Reservation[]>(`/reservations/me?userId=${encodeURIComponent(userId)}`)
}
