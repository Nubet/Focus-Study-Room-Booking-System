import type { RoomSort, RoomStatusFilter } from '../../../shared/types/ui'

export type RoomsFilterState = {
  query: string
  buildingCode: string
  status: RoomStatusFilter
  sort: RoomSort
  day: string
  fromTime: string
  toTime: string
}

export type RoomAvailabilityInput = {
  day?: string
  fromTime?: string
  toTime?: string
}
