import { useMemo, useState } from 'react'
import type { Reservation } from '../../../entities/reservation/model/types'
import type { Room } from '../../../entities/room/model/types'
import { DAY_RANGE } from '../../../shared/constants/time'
import type { RoomSort, RoomStatusFilter } from '../../../shared/types/common'
import { buildDayOptions, isValidRange, toIsoDateTime } from '../../../shared/utils/dateTime'
import { moderatorApi } from '../../moderator/api/moderator.api'
import { roomsExplorerApi } from '../api/rooms.api'

const dayOptions = buildDayOptions(DAY_RANGE)
export const sharedDayOptions = dayOptions

export function useRoomsExplorer(
  userId: string,
  run: (action: () => Promise<void>) => Promise<void>,
  setMessage: (msg: string) => void
) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [myBookedRoomIds, setMyBookedRoomIds] = useState<string[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([])

  const [roomsFilter, setRoomsFilter] = useState({
    query: '',
    buildingCode: 'ALL',
    status: 'ALL' as RoomStatusFilter,
    sort: 'ROOM_ASC' as RoomSort,
    day: dayOptions[0].value,
    fromTime: '09:00',
    toTime: '10:00'
  })

  const availableSet = useMemo(() => new Set(availableRooms.map((room) => room.id)), [availableRooms])
  const myBookedSet = useMemo(() => new Set(myBookedRoomIds), [myBookedRoomIds])

  const loadRooms = async (adminHeaders: HeadersInit) => {
    await run(async () => {
      const result = await roomsExplorerApi.getAllRooms(adminHeaders)
      setRooms(result)
      setMessage(`Loaded ${result.length} rooms.`)
    })
  }

  const loadAvailableRooms = async (input?: { day?: string; fromTime?: string; toTime?: string }) => {
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
        roomsExplorerApi.getAvailableRooms(from, to),
        roomsExplorerApi.getMyReservations(userId)
      ])

      const mineForRange = mine
        .filter((reservation) => {
          const blocking = reservation.status === 'RESERVED' || reservation.status === 'OCCUPIED'
          if (!blocking) return false
          return new Date(reservation.startTime) < new Date(to) && new Date(reservation.endTime) > new Date(from)
        })
        .map((reservation) => reservation.roomId)

      setAvailableRooms(available)
      setMyBookedRoomIds(Array.from(new Set(mineForRange)))
      setMessage(`Loaded ${available.length} available rooms.`)
    })
  }

  const loadModeratorReservations = async (
    adminHeaders: HeadersInit,
    filter: { status: string; roomId: string; from: string; to: string }
  ) => {
    await run(async () => {
      const query = new URLSearchParams()
      if (filter.status) query.set('status', filter.status)
      if (filter.roomId) query.set('roomId', filter.roomId)
      if (filter.from) query.set('from', new Date(filter.from).toISOString())
      if (filter.to) query.set('to', new Date(filter.to).toISOString())
      const suffix = query.toString() ? `?${query.toString()}` : ''
      const result = await moderatorApi.getReservations(suffix, adminHeaders)
      setAllReservations(result)
      setMessage(`Loaded ${result.length} reservations.`)
    })
  }

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
