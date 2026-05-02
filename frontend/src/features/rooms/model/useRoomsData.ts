import { useCallback, useMemo, useState } from 'react'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { Room } from '../../../entities/room/model/types'
import { getBookedRoomIdsForRange } from '../../../entities/reservation/model/utils'
import { DAY_RANGE } from '../../../shared/constants/time'
import type { AsyncActionRunner } from '../../../shared/hooks/useAsyncAction'
import { buildDayOptions, isValidRange, toIsoDateTime } from '../../../shared/utils/dateTime'
import { moderatorApi } from '../../moderator/api/moderator.api'
import { buildReservationsQuerySuffix } from '../../moderator/model/query'
import type { ModeratorReservationFilter } from '../../moderator/model/reservationFilter'
import { roomsApi } from '../api/rooms.api'
import type { RoomAvailabilityInput, RoomsFilterState } from './types'

const dayOptions = buildDayOptions(DAY_RANGE)
export const sharedDayOptions = dayOptions

export function useRoomsData(
  userId: string,
  run: AsyncActionRunner,
  setMessage: (msg: string) => void
) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [myBookedRoomIds, setMyBookedRoomIds] = useState<string[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([])

  const [roomsFilter, setRoomsFilter] = useState<RoomsFilterState>({
    query: '',
    buildingCode: 'ALL',
    status: 'ALL',
    sort: 'ROOM_ASC',
    day: dayOptions[0].value,
    fromTime: '09:00',
    toTime: '10:00'
  })

  const availableSet = useMemo(() => new Set(availableRooms.map((room) => room.id)), [availableRooms])
  const myBookedSet = useMemo(() => new Set(myBookedRoomIds), [myBookedRoomIds])

  const loadRooms = useCallback(async (adminHeaders: HeadersInit) => {
    await run(async () => {
      const result = await roomsApi.getAllRooms(adminHeaders)
      setRooms(result)
      setMessage(`Loaded ${result.length} rooms.`)
    })
  }, [run, setMessage])

  const loadAvailableRooms = useCallback(async (input?: RoomAvailabilityInput) => {
    await run(async () => {
      const day = input?.day ?? roomsFilter.day
      const fromTime = input?.fromTime ?? roomsFilter.fromTime
      const toTime = input?.toTime ?? roomsFilter.toTime
      const from = toIsoDateTime(day, fromTime)
      const to = toIsoDateTime(day, toTime)

      if (!isValidRange(from, to)) {
        setMessage('End time must be later than start time.')
        return
      }

      const [available, mine] = await Promise.all([
        roomsApi.getAvailableRooms(from, to),
        roomsApi.getMyReservations(userId)
      ])

      const mineForRange = getBookedRoomIdsForRange(mine, from, to)

      setAvailableRooms(available)
      setMyBookedRoomIds(Array.from(new Set(mineForRange)))
      setMessage(`Loaded ${available.length} available rooms.`)
    })
  }, [roomsFilter.day, roomsFilter.fromTime, roomsFilter.toTime, run, setMessage, userId])

  const loadModeratorReservations = useCallback(async (
    adminHeaders: HeadersInit,
    filter: ModeratorReservationFilter
  ) => {
    await run(async () => {
      const suffix = buildReservationsQuerySuffix(filter)
      const result = await moderatorApi.getReservations(suffix, adminHeaders)
      setAllReservations(result)
      setMessage(`Loaded ${result.length} reservations.`)
    })
  }, [run, setMessage])

  return {
    rooms,
    availableSet,
    myBookedSet,
    allReservations,
    roomsFilter,
    setRoomsFilter,
    loadRooms,
    loadAvailableRooms,
    loadModeratorReservations
  }
}
