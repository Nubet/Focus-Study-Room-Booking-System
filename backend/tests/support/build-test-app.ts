import { buildApp } from '@src/app/build-app.js'
import { InMemoryBuildingRepository } from './in-memory-building-repository.js'
import { InMemoryReservationRepository } from './in-memory-reservation-repository.js'
import { InMemoryRoomRepository } from './in-memory-room-repository.js'

export function buildTestApp() {
  return buildApp(
    new InMemoryBuildingRepository(),
    new InMemoryRoomRepository(),
    new InMemoryReservationRepository()
  )
}
