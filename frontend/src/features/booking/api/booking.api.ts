import { request } from '../../../shared/api/httpClient'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { CreateReservationRequest } from '../model/types'

export const bookingApi = {
  createReservation: (payload: CreateReservationRequest) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
}
