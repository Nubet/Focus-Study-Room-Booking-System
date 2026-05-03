import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Room } from '@/entities/room/model/types'
import { RoomAvailabilitySchedule } from '@/features/rooms/ui/RoomAvailabilitySchedule'
import { useRoomWeeklySchedule } from '@/features/rooms/model/useRoomWeeklySchedule'
import { TIME_OPTIONS } from '@/shared/constants/time'
import type { RoomSort, RoomStatusFilter } from '@/shared/types/ui'
import { splitRoomId } from '@/shared/utils/roomId'
import type { RoomsFilterState } from '@/features/rooms/model/types'

type BuildingMap = Map<string, string>

type Props = {
  panelClass: string
  inputClass: string
  labelClass: string
  userId: string
  adminHeaders: HeadersInit
  rooms: Room[]
  roomsFilter: RoomsFilterState
  setRoomsFilter: Dispatch<SetStateAction<RoomsFilterState>>
  buildingNameByCode: BuildingMap
  buildingOptions: Array<{ code: string }>
  availableSet: Set<string>
  myBookedSet: Set<string>
  loadRooms: () => void
  loadAvailableRooms: () => void
  dayOptions: Array<{ value: string; label: string }>
}

const ROOM_STATUS_FILTERS: RoomStatusFilter[] = ['ALL', 'AVAILABLE', 'UNAVAILABLE']
const ROOM_SORTS: RoomSort[] = ['ROOM_ASC', 'ROOM_DESC', 'BUILDING']

function isRoomStatusFilter(value: string): value is RoomStatusFilter {
  return ROOM_STATUS_FILTERS.includes(value as RoomStatusFilter)
}

function isRoomSort(value: string): value is RoomSort {
  return ROOM_SORTS.includes(value as RoomSort)
}

function getVisibleRooms(
  rooms: Room[],
  roomsFilter: RoomsFilterState,
  buildingNameByCode: BuildingMap,
  availableSet: Set<string>,
  roomIdCollator: Intl.Collator
): Room[] {
  return [...rooms]
    .filter((room) => {
      const { buildingCode } = splitRoomId(room.id)
      if (roomsFilter.buildingCode !== 'ALL' && buildingCode !== roomsFilter.buildingCode) return false
      if (roomsFilter.query) {
        const query = roomsFilter.query.toLowerCase().trim()
        const buildingName = (buildingNameByCode.get(buildingCode) ?? '').toLowerCase()
        const isIdMatch = room.id.toLowerCase().startsWith(query)
        const isNameMatch = buildingName.startsWith(query) || buildingName.includes(` ${query}`)
        if (!isIdMatch && !isNameMatch) return false
      }
      const isAvailable = availableSet.has(room.id)
      if (roomsFilter.status === 'AVAILABLE' && !isAvailable) return false
      if (roomsFilter.status === 'UNAVAILABLE' && isAvailable) return false
      return true
    })
    .sort((a, b) => {
      if (roomsFilter.sort === 'ROOM_ASC') return roomIdCollator.compare(a.id, b.id)
      if (roomsFilter.sort === 'ROOM_DESC') return roomIdCollator.compare(b.id, a.id)

      const { buildingCode: buildingCodeA } = splitRoomId(a.id)
      const { buildingCode: buildingCodeB } = splitRoomId(b.id)
      const buildingNameA = buildingNameByCode.get(buildingCodeA) ?? buildingCodeA
      const buildingNameB = buildingNameByCode.get(buildingCodeB) ?? buildingCodeB
      const byBuildingName = buildingNameA.localeCompare(buildingNameB, undefined, { sensitivity: 'base' })

      if (byBuildingName !== 0) return byBuildingName
      return roomIdCollator.compare(a.id, b.id)
    })
}

type FiltersProps = {
  inputClass: string
  labelClass: string
  roomsFilter: RoomsFilterState
  setRoomsFilter: Dispatch<SetStateAction<RoomsFilterState>>
  buildingOptions: Array<{ code: string }>
  dayOptions: Array<{ value: string; label: string }>
  fromTimeOptions: string[]
  toTimeOptions: string[]
}

function RoomsFilters({
  inputClass,
  labelClass,
  roomsFilter,
  setRoomsFilter,
  buildingOptions,
  dayOptions,
  fromTimeOptions,
  toTimeOptions
}: FiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
        <label className={labelClass}>Search room or building</label>
        <input className={inputClass} value={roomsFilter.query} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, query: event.target.value }))} placeholder="A1-120 or chemistry" />
      </div>
      <div>
        <label className={labelClass}>Building</label>
        <select className={inputClass} value={roomsFilter.buildingCode} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, buildingCode: event.target.value }))}>
          <option value="ALL">All</option>
          {buildingOptions.map((building) => <option key={building.code} value={building.code}>{building.code}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select
          className={inputClass}
          value={roomsFilter.status}
          onChange={(event) => {
            if (!isRoomStatusFilter(event.target.value)) return
            const nextStatus: RoomStatusFilter = event.target.value
            setRoomsFilter((prev) => ({ ...prev, status: nextStatus }))
          }}
        >
          <option value="ALL">All</option>
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Sort</label>
        <select
          className={inputClass}
          value={roomsFilter.sort}
          onChange={(event) => {
            if (!isRoomSort(event.target.value)) return
            const nextSort: RoomSort = event.target.value
            setRoomsFilter((prev) => ({ ...prev, sort: nextSort }))
          }}
        >
          <option value="ROOM_ASC">Room A-Z</option>
          <option value="ROOM_DESC">Room Z-A</option>
          <option value="BUILDING">Building (A-Z)</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Day</label>
        <select className={inputClass} value={roomsFilter.day} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, day: event.target.value }))}>
          {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>From hour</label>
        <select
          className={inputClass}
          value={roomsFilter.fromTime}
          onChange={(event) => {
            const nextFrom = event.target.value
            setRoomsFilter((prev) => {
              const nextTo = nextFrom >= prev.toTime ? TIME_OPTIONS[TIME_OPTIONS.indexOf(nextFrom) + 1] : prev.toTime
              return { ...prev, fromTime: nextFrom, toTime: nextTo }
            })
          }}
        >
          {fromTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>To hour</label>
        <select
          className={inputClass}
          value={roomsFilter.toTime}
          onChange={(event) => {
            const nextTo = event.target.value
            setRoomsFilter((prev) => {
              const nextFrom = nextTo <= prev.fromTime ? TIME_OPTIONS[TIME_OPTIONS.indexOf(nextTo) - 1] : prev.fromTime
              return { ...prev, fromTime: nextFrom, toTime: nextTo }
            })
          }}
        >
          {toTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
        </select>
      </div>
    </div>
  )
}

export function RoomsPage({
  panelClass,
  inputClass,
  labelClass,
  userId,
  adminHeaders,
  rooms,
  roomsFilter,
  setRoomsFilter,
  buildingNameByCode,
  buildingOptions,
  availableSet,
  myBookedSet,
  loadRooms,
  loadAvailableRooms,
  dayOptions
}: Props) {
  const roomIdCollator = useMemo(() => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }), [])
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const detailsRef = useRef<HTMLDivElement | null>(null)

  const fromTimeOptions = useMemo(() => {
    const endIndex = TIME_OPTIONS.indexOf(roomsFilter.toTime)
    if (endIndex <= 0) return TIME_OPTIONS.slice(0, -1)
    return TIME_OPTIONS.slice(0, endIndex)
  }, [roomsFilter.toTime])

  const toTimeOptions = useMemo(() => {
    const startIndex = TIME_OPTIONS.indexOf(roomsFilter.fromTime)
    if (startIndex === -1 || startIndex >= TIME_OPTIONS.length - 1) return TIME_OPTIONS.slice(1)
    return TIME_OPTIONS.slice(startIndex + 1)
  }, [roomsFilter.fromTime])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAvailableRooms()
    }, 350)

    return () => clearTimeout(timeout)
  }, [roomsFilter.day, roomsFilter.fromTime, roomsFilter.toTime, loadAvailableRooms])

  const visibleRooms = useMemo(
    () => getVisibleRooms(rooms, roomsFilter, buildingNameByCode, availableSet, roomIdCollator),
    [rooms, roomsFilter, buildingNameByCode, availableSet, roomIdCollator]
  )

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  )

  const selectedRoomAvailability = selectedRoom ? availableSet.has(selectedRoom.id) : false
  const selectedRoomBookedByYou = selectedRoom ? myBookedSet.has(selectedRoom.id) : false
  const selectedBuildingName = selectedRoom
    ? buildingNameByCode.get(splitRoomId(selectedRoom.id).buildingCode) ?? 'Unknown building'
    : ''

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const { weekSchedule, loading: scheduleLoading, error: scheduleError } = useRoomWeeklySchedule(
    {
      selectedRoomId,
      day: roomsFilter.day,
      userId,
      adminHeaders
    }
  )

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-bold uppercase tracking-tight">All Rooms</h2>
        <button className="btn-primary bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={loadRooms}>Load rooms</button>
        <button className="btn-primary bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={loadAvailableRooms}>Refresh availability</button>
      </div>

      <RoomsFilters
        inputClass={inputClass}
        labelClass={labelClass}
        roomsFilter={roomsFilter}
        setRoomsFilter={setRoomsFilter}
        buildingOptions={buildingOptions}
        dayOptions={dayOptions}
        fromTimeOptions={fromTimeOptions}
        toTimeOptions={toTimeOptions}
      />

      <div className="mb-3 text-sm font-semibold tracking-wide text-text-muted">
        {selectedRoom ? `Selected room: ${selectedRoom.id}` : 'Select a room to open details'}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleRooms.length === 0 ? (
          <p className="text-sm font-semibold text-text-muted">No rooms found.</p>
        ) : (
          visibleRooms.map((room) => {
            const { buildingCode, roomNumber } = splitRoomId(room.id)
            const isAvailable = availableSet.has(room.id)
            const isBookedByYou = myBookedSet.has(room.id)
            const isSelected = selectedRoomId === room.id

            return (
              <button key={room.id} type="button" className={`u-border-strong p-4 text-left ${isSelected ? 'bg-brand-primary text-white shadow-raised' : ''} ${isBookedByYou ? 'bg-status-booked-self' : isAvailable ? 'bg-status-available' : 'bg-status-unavailable'}`} onClick={() => handleSelectRoom(room.id)}>
                <div className="mb-2 h-8 w-8 u-border-strong bg-bg-canvas sm:h-10 sm:w-10" />
                <p className="text-lg font-bold">
                  <span className={isSelected ? 'text-white' : 'text-brand-primary'}>{buildingCode}</span>
                  <span>-</span>
                  <span className={isSelected ? 'text-white' : 'text-status-danger'}>{roomNumber}</span>
                </p>
                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-text-muted'}`}>{buildingNameByCode.get(buildingCode) ?? 'Unknown building'}</p>
                <p className="mt-2 text-sm font-semibold tracking-wide">{isBookedByYou ? 'Booked by you' : isAvailable ? 'Available' : 'Unavailable'}</p>
              </button>
            )
          })
        )}
      </div>

      <div ref={detailsRef} className="mt-4 u-border-strong bg-white p-4">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Room details</p>
        {!selectedRoom ? (
          <p className="text-sm font-semibold text-text-muted">Select a room card to inspect availability and details.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 text-sm font-semibold">
              <p><span className="font-bold">Room:</span> {selectedRoom.id}</p>
              <p><span className="font-bold">Building:</span> {selectedBuildingName}</p>
              <p><span className="font-bold">Time window:</span> {roomsFilter.day} {roomsFilter.fromTime}-{roomsFilter.toTime}</p>
            </div>
            <div className="space-y-1 text-sm font-semibold">
              <p><span className="font-bold">Status:</span> {selectedRoomBookedByYou ? 'Booked by you' : selectedRoomAvailability ? 'Available' : 'Unavailable'}</p>
              <p className="text-xs text-text-muted">Tip: Adjust Day/From/To filters to inspect this room at a different time.</p>
            </div>
          </div>
        )}
      </div>

      <RoomAvailabilitySchedule
        selectedRoomId={selectedRoomId}
        day={roomsFilter.day}
        weekSchedule={weekSchedule}
        loading={scheduleLoading}
        error={scheduleError}
      />
    </section>
  )
}
