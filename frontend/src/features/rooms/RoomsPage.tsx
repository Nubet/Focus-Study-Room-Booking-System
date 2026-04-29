import type { Dispatch, SetStateAction } from 'react'
import type { Room } from '../../entities/room/model/types'
import type { RoomSort, RoomStatusFilter } from '../../shared/types/common'
import { TIME_OPTIONS } from '../../shared/constants/time'

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
  onPickRoom: (roomId: string) => void
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
  onPickRoom,
  dayOptions
}: Props) {
  const visibleRooms = [...rooms]
    .filter((room) => {
      const [buildingCode] = room.id.split('-')
      if (roomsFilter.buildingCode !== 'ALL' && buildingCode !== roomsFilter.buildingCode) return false
      const roomLabel = `${room.id} ${(buildingNameByCode.get(buildingCode) ?? '').toLowerCase()}`
      if (roomsFilter.query && !roomLabel.toLowerCase().includes(roomsFilter.query.toLowerCase())) return false
      const isAvailable = availableSet.has(room.id)
      if (roomsFilter.status === 'AVAILABLE' && !isAvailable) return false
      if (roomsFilter.status === 'UNAVAILABLE' && isAvailable) return false
      return true
    })
    .sort((a, b) => {
      if (roomsFilter.sort === 'ROOM_ASC') return a.id.localeCompare(b.id)
      if (roomsFilter.sort === 'ROOM_DESC') return b.id.localeCompare(a.id)
      const [ab] = a.id.split('-')
      const [bb] = b.id.split('-')
      if (ab === bb) return a.id.localeCompare(b.id)
      return ab.localeCompare(bb)
    })

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
            <option value="BUILDING">Building</option>
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
          <select className={inputClass} value={roomsFilter.fromTime} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, fromTime: event.target.value }))}>
            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>To hour</label>
          <select className={inputClass} value={roomsFilter.toTime} onChange={(event) => setRoomsFilter((prev) => ({ ...prev, toTime: event.target.value }))}>
            {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleRooms.length === 0 ? (
          <p className="text-sm font-semibold text-text-muted">No rooms found.</p>
        ) : (
          visibleRooms.map((room) => {
            const [buildingCode] = room.id.split('-')
            const isAvailable = availableSet.has(room.id)
            const isBookedByYou = myBookedSet.has(room.id)

            return (
              <button key={room.id} type="button" className={`brutal-border p-4 text-left ${isBookedByYou ? 'bg-state-booked-by-you' : isAvailable ? 'bg-state-available' : 'bg-state-unavailable'}`} onClick={() => onPickRoom(room.id)}>
                <div className="mb-2 h-10 w-10 brutal-border bg-bg-canvas" />
                <p className="text-lg font-black">{room.id}</p>
                <p className="text-xs font-semibold text-text-muted">{buildingNameByCode.get(buildingCode) ?? 'Unknown building'}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-wider">{isBookedByYou ? 'Booked by you' : isAvailable ? 'Available' : 'Unavailable'}</p>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
