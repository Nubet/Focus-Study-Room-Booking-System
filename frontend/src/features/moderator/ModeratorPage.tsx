import type { FormEvent } from 'react'
import { useState } from 'react'
import { moderatorApi } from './api/moderator.api'
import type { Reservation } from '../../entities/reservation/model/types'
import type { ReservationStatus } from '../../entities/reservation/model/status'
import type { Room } from '../../entities/room/model/types'
import { splitRoomId } from '../../shared/utils/roomId'

const statusColorMap: Record<ReservationStatus, string> = {
  RESERVED: 'bg-brand-primary text-white',
  OCCUPIED: 'bg-brand-accent text-black',
  NO_SHOW_RELEASED: 'bg-danger text-white',
  CANCELLED: 'bg-neutral text-black',
  COMPLETED: 'bg-success text-white'
}

type Props = {
  panelClass: string
  inputClass: string
  adminHeaders: HeadersInit
  rooms: Room[]
  reservations: Reservation[]
  run: (action: () => Promise<void>) => Promise<void>
  setMessage: (value: string) => void
  reloadRooms: () => Promise<void>
  reloadReservations: () => Promise<void>
}

export function ModeratorPage({
  panelClass,
  inputClass,
  adminHeaders,
  rooms,
  reservations,
  run,
  setMessage,
  reloadRooms,
  reloadReservations
}: Props) {
  const [expandedReservationId, setExpandedReservationId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [adminRoomForm, setAdminRoomForm] = useState({ newId: '', targetId: '' })
  const [reservationStatusDrafts, setReservationStatusDrafts] = useState<Record<string, ReservationStatus>>({})

  const createRoom = (event: FormEvent) => {
    event.preventDefault()
    if (!adminRoomForm.newId) {
      setMessage('Enter new room id.')
      return
    }
    run(async () => {
      const result = await moderatorApi.createRoom(adminRoomForm.newId, adminHeaders)
      setMessage(`Room created: ${result.id}`)
      setAdminRoomForm((prev) => ({ ...prev, newId: '' }))
      await reloadRooms()
    })
  }

  const renameRoom = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedRoomId || !adminRoomForm.targetId) {
      setMessage('Select room and enter new id.')
      return
    }
    run(async () => {
      const result = await moderatorApi.renameRoom(selectedRoomId, adminRoomForm.targetId, adminHeaders)
      setMessage(`Room updated: ${result.id}`)
      setSelectedRoomId(result.id)
      setAdminRoomForm((prev) => ({ ...prev, targetId: '' }))
      await reloadRooms()
    })
  }

  const deleteRoom = () => {
    if (!selectedRoomId) {
      setMessage('Select room first.')
      return
    }
    run(async () => {
      await moderatorApi.deleteRoom(selectedRoomId, adminHeaders)
      setMessage('Room deleted.')
      setSelectedRoomId('')
      await reloadRooms()
    })
  }

  const updateReservationStatus = (reservationId: string, status: ReservationStatus) => {
    run(async () => {
      await moderatorApi.updateReservationStatus(reservationId, status, adminHeaders)
      setMessage(`Status updated: ${reservationId} -> ${status}`)
      await reloadReservations()
    })
  }

  const getDraftStatus = (reservation: Reservation): ReservationStatus => {
    return reservationStatusDrafts[reservation.id] ?? reservation.status
  }

  const setDraftStatus = (reservationId: string, status: ReservationStatus) => {
    setReservationStatusDrafts((prev) => ({ ...prev, [reservationId]: status }))
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap gap-2">
        <h2 className="mr-auto text-2xl font-black uppercase tracking-tight">Moderator</h2>
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => void reloadRooms()}>Load rooms</button>
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => void reloadReservations()}>Load reservations</button>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <form className="brutal-border bg-white p-4" onSubmit={createRoom}>
          <p className="mb-2 text-sm font-black uppercase tracking-wider">Create room</p>
          <input className={`${inputClass} mb-3`} value={adminRoomForm.newId} onChange={(event) => setAdminRoomForm((prev) => ({ ...prev, newId: event.target.value }))} placeholder="A10-314" />
          <button className="btn-brutal w-full bg-text-primary py-3 text-white" type="submit">Create</button>
        </form>
        <form className="brutal-border bg-white p-4" onSubmit={renameRoom}>
          <p className="mb-2 text-sm font-black uppercase tracking-wider">Rename room</p>
          <input className={`${inputClass} mb-2`} value={selectedRoomId} readOnly placeholder="Select room below" />
          <input className={`${inputClass} mb-3`} value={adminRoomForm.targetId} onChange={(event) => setAdminRoomForm((prev) => ({ ...prev, targetId: event.target.value }))} placeholder="Target" />
          <button className="btn-brutal w-full bg-brand-accent py-3" type="submit">Update</button>
        </form>
        <div className="brutal-border bg-white p-4">
          <p className="mb-2 text-sm font-black uppercase tracking-wider">Delete room</p>
          <input className={`${inputClass} mb-3`} value={selectedRoomId} readOnly placeholder="Select room below" />
          <button className="btn-brutal w-full bg-danger py-3 text-white" type="button" onClick={deleteRoom}>Delete</button>
        </div>
      </div>

      <div className="mt-4 brutal-border bg-bg-canvas p-4">
        <p className="mb-2 text-sm font-black uppercase tracking-wider">Rooms</p>
        <div className="max-h-72 space-y-2 overflow-auto pr-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`w-full brutal-border bg-white p-3 text-left ${selectedRoomId === room.id ? 'bg-brand-accent' : ''}`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <p className="font-black">
                <span className="text-brand-primary">{splitRoomId(room.id).buildingCode}</span>
                <span>-</span>
                <span className="text-danger">{splitRoomId(room.id).roomNumber}</span>
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="brutal-border bg-bg-canvas p-4">
          <p className="mb-2 text-sm font-black uppercase tracking-wider">Reservations</p>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="brutal-border bg-white p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedReservationId((prev) => (prev === reservation.id ? '' : reservation.id))}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-black">{reservation.id}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${statusColorMap[reservation.status]}`}>{reservation.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-text-muted">{reservation.roomId} · {reservation.userId}</p>
                </button>

                {expandedReservationId === reservation.id ? (
                  <div className="mt-3 border-t-[3px] border-text-primary pt-3">
                    <p className="text-xs font-semibold text-text-muted">
                      {new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <select
                        className={inputClass}
                        value={getDraftStatus(reservation)}
                        onChange={(event) => setDraftStatus(reservation.id, event.target.value as ReservationStatus)}
                      >
                        <option value="RESERVED">RESERVED</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="NO_SHOW_RELEASED">NO_SHOW_RELEASED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                      <button
                        className="btn-brutal bg-danger px-4 py-2 text-white"
                        type="button"
                        onClick={() => updateReservationStatus(reservation.id, getDraftStatus(reservation))}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="brutal-border bg-white p-4">
          <p className="mb-2 text-sm font-black uppercase tracking-wider">How to manage</p>
          <ol className="space-y-2 text-sm font-semibold text-text-muted">
            <li>1. Click any reservation row to expand it.</li>
            <li>2. Select a new status from the dropdown.</li>
            <li>3. Click Update to save changes.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
