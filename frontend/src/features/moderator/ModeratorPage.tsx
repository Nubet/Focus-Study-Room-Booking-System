import type { FormEvent } from 'react'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { isReservationStatus, RESERVATION_STATUSES } from '@/entities/reservation/model/status'
import type { ReservationStatus } from '@/entities/reservation/model/status'
import type { Reservation } from '@/entities/reservation/model/types'
import type { Room } from '@/entities/room/model/types'
import type { AsyncActionRunner } from '@/shared/hooks/useAsyncAction'
import { splitRoomId } from '@/shared/utils/roomId'
import { moderatorApi } from '@/features/moderator/api/moderator.api'

const statusColorMap: Record<ReservationStatus, string> = {
  RESERVED: 'bg-brand-primary text-white',
  OCCUPIED: 'bg-brand-accent text-black',
  NO_SHOW_RELEASED: 'bg-status-danger text-white',
  CANCELLED: 'bg-border-default text-black',
  COMPLETED: 'bg-status-success text-white'
}

type Props = {
  panelClass: string
  inputClass: string
  adminHeaders: HeadersInit
  rooms: Room[]
  reservations: Reservation[]
  run: AsyncActionRunner
  setMessage: (value: string) => void
  reloadRooms: () => Promise<void>
  reloadReservations: () => Promise<void>
}

type AdminRoomForm = {
  newId: string
  targetId: string
}

function RoomActionsPanel({
  inputClass,
  rooms,
  selectedRoomId,
  setSelectedRoomId,
  adminRoomForm,
  setAdminRoomForm,
  onCreateRoom,
  onRenameRoom,
  onDeleteRoom
}: {
  inputClass: string
  rooms: Room[]
  selectedRoomId: string
  setSelectedRoomId: (value: string) => void
  adminRoomForm: AdminRoomForm
  setAdminRoomForm: Dispatch<SetStateAction<AdminRoomForm>>
  onCreateRoom: (event: FormEvent) => void
  onRenameRoom: (event: FormEvent) => void
  onDeleteRoom: () => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <form className="u-border-strong bg-white p-4" onSubmit={onCreateRoom}>
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Create room</p>
        <input className={`${inputClass} mb-3`} value={adminRoomForm.newId} onChange={(event) => setAdminRoomForm((prev) => ({ ...prev, newId: event.target.value }))} placeholder="A10-314" />
        <button className="btn-primary min-h-11 w-full bg-text-primary py-3 text-white" type="submit">Create</button>
      </form>
      <form className="u-border-strong bg-white p-4" onSubmit={onRenameRoom}>
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Rename room</p>
        <input className={`${inputClass} mb-2`} value={selectedRoomId} readOnly placeholder="Select room below" />
        <input className={`${inputClass} mb-3`} value={adminRoomForm.targetId} onChange={(event) => setAdminRoomForm((prev) => ({ ...prev, targetId: event.target.value }))} placeholder="Target" />
        <button className="btn-primary min-h-11 w-full bg-brand-accent py-3" type="submit">Update</button>
      </form>
      <div className="u-border-strong bg-white p-4 md:col-span-2 xl:col-span-1">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Delete room</p>
        <input className={`${inputClass} mb-3`} value={selectedRoomId} readOnly placeholder="Select room below" />
        <button className="btn-primary min-h-11 w-full bg-status-danger py-3 text-white" type="button" onClick={onDeleteRoom}>Delete</button>
      </div>
      <div className="mt-0 u-border-strong bg-bg-canvas p-4 md:col-span-2 xl:col-span-3">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Rooms</p>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {rooms.map((room) => {
            const { buildingCode, roomNumber } = splitRoomId(room.id)
            return (
              <button
                key={room.id}
                type="button"
                className={`w-full u-border-strong bg-white p-3 min-h-11 text-left ${selectedRoomId === room.id ? 'bg-brand-accent' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <p className="font-bold">
                  <span className="text-brand-primary">{buildingCode}</span>
                  <span>-</span>
                  <span className="text-status-danger">{roomNumber}</span>
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ReservationsPanel({
  inputClass,
  reservations,
  expandedReservationId,
  setExpandedReservationId,
  getDraftStatus,
  onDraftStatusChange,
  onUpdateStatus
}: {
  inputClass: string
  reservations: Reservation[]
  expandedReservationId: string
  setExpandedReservationId: (value: string) => void
  getDraftStatus: (reservation: Reservation) => ReservationStatus
  onDraftStatusChange: (reservationId: string, value: string) => void
  onUpdateStatus: (reservationId: string, status: ReservationStatus) => void
}) {
  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <div className="overflow-hidden u-border-strong bg-bg-canvas p-4">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Reservations</p>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="overflow-hidden u-border-strong bg-white p-3">
              <button
                type="button"
                className="min-h-11 w-full text-left"
                onClick={() => setExpandedReservationId(expandedReservationId === reservation.id ? '' : reservation.id)}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="break-all font-bold">{reservation.id}</span>
                  <span className={`whitespace-nowrap px-2 py-0.5 text-xs font-bold uppercase ${statusColorMap[reservation.status]}`}>{reservation.status}</span>
                </div>
                <p className="break-words text-xs font-semibold text-text-muted">{reservation.roomId} · {reservation.userId}</p>
              </button>

              {expandedReservationId === reservation.id ? (
                <div className="mt-3 border-t-[3px] border-text-primary pt-3">
                  <p className="text-xs font-semibold text-text-muted">{new Date(reservation.startTime).toLocaleString()} - {new Date(reservation.endTime).toLocaleString()}</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <select className={`${inputClass} flex-1`} value={getDraftStatus(reservation)} onChange={(event) => onDraftStatusChange(reservation.id, event.target.value)}>
                      {RESERVATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <button className="btn-primary w-full bg-status-danger px-4 py-2 min-h-11 text-white sm:w-auto" type="button" onClick={() => onUpdateStatus(reservation.id, getDraftStatus(reservation))}>Update</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="u-border-strong bg-white p-4">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">How to manage</p>
        <ol className="space-y-2 text-sm font-semibold text-text-muted">
          <li>1. Click any reservation row to expand it.</li>
          <li>2. Select a new status from the dropdown.</li>
          <li>3. Click Update to save changes.</li>
        </ol>
      </div>
    </div>
  )
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
  const [adminRoomForm, setAdminRoomForm] = useState<AdminRoomForm>({ newId: '', targetId: '' })
  const [reservationStatusDrafts, setReservationStatusDrafts] = useState<Record<string, ReservationStatus>>({})

  const createRoom = (event: FormEvent) => {
    event.preventDefault()
    if (!adminRoomForm.newId) {
      setMessage('Enter new room id.')
      return
    }
    void run(async () => {
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
    void run(async () => {
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
    void run(async () => {
      await moderatorApi.deleteRoom(selectedRoomId, adminHeaders)
      setMessage('Room deleted.')
      setSelectedRoomId('')
      await reloadRooms()
    })
  }

  const updateReservationStatus = (reservationId: string, status: ReservationStatus) => {
    void run(async () => {
      await moderatorApi.updateReservationStatus(reservationId, status, adminHeaders)
      setMessage(`Status updated: ${reservationId} -> ${status}`)
      await reloadReservations()
    })
  }

  const getDraftStatus = (reservation: Reservation): ReservationStatus => {
    return reservationStatusDrafts[reservation.id] ?? reservation.status
  }

  const handleDraftStatusChange = (reservationId: string, value: string) => {
    if (!isReservationStatus(value)) return
    setReservationStatusDrafts((prev) => ({ ...prev, [reservationId]: value }))
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap gap-2">
        <h2 className="mr-auto text-2xl font-bold uppercase tracking-tight">Moderator</h2>
        <button className="btn-primary bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => void reloadRooms()}>Load rooms</button>
        <button className="btn-primary bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => void reloadReservations()}>Load reservations</button>
      </div>

      <RoomActionsPanel
        inputClass={inputClass}
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        adminRoomForm={adminRoomForm}
        setAdminRoomForm={setAdminRoomForm}
        onCreateRoom={createRoom}
        onRenameRoom={renameRoom}
        onDeleteRoom={deleteRoom}
      />

      <ReservationsPanel
        inputClass={inputClass}
        reservations={reservations}
        expandedReservationId={expandedReservationId}
        setExpandedReservationId={setExpandedReservationId}
        getDraftStatus={getDraftStatus}
        onDraftStatusChange={handleDraftStatusChange}
        onUpdateStatus={updateReservationStatus}
      />
    </section>
  )
}
