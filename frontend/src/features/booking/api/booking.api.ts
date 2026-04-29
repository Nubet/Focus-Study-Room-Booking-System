import { request } from '../../../shared/api/httpClient'
import type { Reservation } from '../../../entities/reservation/model/types'

export const bookingApi = {
  createReservation: (payload: {
    id: string
    roomId: string
    userId: string
    startTime: string
    endTime: string
  }) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
