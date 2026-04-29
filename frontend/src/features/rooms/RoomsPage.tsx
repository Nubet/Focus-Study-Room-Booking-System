import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Room } from '../../entities/room/model/types'
import type { RoomSort, RoomStatusFilter } from '../../shared/types/common'
import { TIME_OPTIONS } from '../../shared/constants/time'
import { splitRoomId } from '../../shared/utils/roomId'

type BuildingMap = Map<string, string>

type Props = {
  panelClass: string
  inputClass: string
  labelClass: string
  rooms: Room[]
  roomsFilter: {
    query: string
    buildingCode: string
    status: RoomStatusFilter
    sort: RoomSort
    day: string
    fromTime: string
    toTime: string
  }
  setRoomsFilter: Dispatch<SetStateAction<{
    query: string
    buildingCode: string
    status: RoomStatusFilter
    sort: RoomSort
    day: string
    fromTime: string
    toTime: string
  }>>
  buildingNameByCode: BuildingMap
  buildingOptions: Array<{ code: string }>
  availableSet: Set<string>
  myBookedSet: Set<string>
  loadRooms: () => void
  loadAvailableRooms: () => void
  dayOptions: Array<{ value: string; label: string }>
}

export function RoomsPage({
  panelClass,
  inputClass,
  labelClass,
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

  const visibleRooms = [...rooms]
    .filter((room) => {
      const [buildingCode] = room.id.split('-')
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

      const [buildingCodeA] = a.id.split('-')
      const [buildingCodeB] = b.id.split('-')
      const buildingNameA = buildingNameByCode.get(buildingCodeA) ?? buildingCodeA
      const buildingNameB = buildingNameByCode.get(buildingCodeB) ?? buildingCodeB
      const byBuildingName = buildingNameA.localeCompare(buildingNameB, undefined, { sensitivity: 'base' })

      if (byBuildingName !== 0) return byBuildingName
      return roomIdCollator.compare(a.id, b.id)
    })

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  )

  const selectedRoomAvailability = selectedRoom ? availableSet.has(selectedRoom.id) : false
  const selectedRoomBookedByYou = selectedRoom ? myBookedSet.has(selectedRoom.id) : false
  const selectedBuildingName = selectedRoom
    ? buildingNameByCode.get(selectedRoom.id.split('-')[0]) ?? 'Unknown building'
    : ''

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-black uppercase tracking-tight">All Rooms</h2>
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={loadRooms}>Load rooms</button>
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={loadAvailableRooms}>Refresh availability</button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <div className="xl:col-span-2">
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
          <select className={inputClass} value={roomsFilter.status} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, status: event.target.value as RoomStatusFilter }))}>
            <option value="ALL">All</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Sort</label>
          <select className={inputClass} value={roomsFilter.sort} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, sort: event.target.value as RoomSort }))}>
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

      <div className="mb-3 text-xs font-black uppercase tracking-wider text-text-muted">
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
              <button key={room.id} type="button" className={`brutal-border p-4 text-left ${isSelected ? 'bg-brand-primary text-white shadow-brutal-sm' : ''} ${isBookedByYou ? 'bg-state-booked-by-you' : isAvailable ? 'bg-state-available' : 'bg-state-unavailable'}`} onClick={() => handleSelectRoom(room.id)}>
                <div className="mb-2 h-10 w-10 brutal-border bg-bg-canvas" />
                <p className="text-lg font-black">
                  <span className={isSelected ? 'text-white' : 'text-brand-primary'}>{buildingCode}</span>
                  <span>-</span>
                  <span className={isSelected ? 'text-white' : 'text-danger'}>{roomNumber}</span>
                </p>
                <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-text-muted'}`}>{buildingNameByCode.get(buildingCode) ?? 'Unknown building'}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-wider">{isBookedByYou ? 'Booked by you' : isAvailable ? 'Available' : 'Unavailable'}</p>
              </button>
            )
          })
        )}
      </div>

      <div ref={detailsRef} className="mt-4 brutal-border bg-white p-4">
        <p className="mb-2 text-sm font-black uppercase tracking-wider">Room details</p>
        {!selectedRoom ? (
          <p className="text-sm font-semibold text-text-muted">Select a room card to inspect availability and details.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 text-sm font-semibold">
              <p><span className="font-black">Room:</span> {selectedRoom.id}</p>
              <p><span className="font-black">Building:</span> {selectedBuildingName}</p>
              <p><span className="font-black">Time window:</span> {roomsFilter.day} {roomsFilter.fromTime}-{roomsFilter.toTime}</p>
            </div>
            <div className="space-y-1 text-sm font-semibold">
              <p><span className="font-black">Status:</span> {selectedRoomBookedByYou ? 'Booked by you' : selectedRoomAvailability ? 'Available' : 'Unavailable'}</p>
              <p className="text-xs text-text-muted">Tip: Adjust Day/From/To filters to inspect this room at a different time.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
