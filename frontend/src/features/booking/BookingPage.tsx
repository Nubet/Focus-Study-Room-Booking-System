import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { bookingApi } from './api/booking.api'
import { TIME_OPTIONS } from '../../shared/constants/time'
import { toIsoDateTime } from '../../shared/utils/dateTime'
import type { Room } from '../../entities/room/model/types'
import type { BookingStep } from '../../shared/types/common'

type Building = { code: string; name: string }

type Props = {
  userId: string
  setUserId: (value: string) => void
  rooms: Room[]
  dayOptions: Array<{ value: string; label: string }>
  run: (action: () => Promise<void>) => Promise<void>
  setMessage: (value: string) => void
  loadAvailableRooms: (input?: { day?: string; fromTime?: string; toTime?: string }) => Promise<void>
  buildings: Building[]
  panelClass: string
  inputClass: string
  labelClass: string
}

export function BookingPage({
  userId,
  setUserId,
  rooms,
  dayOptions,
  run,
  setMessage,
  loadAvailableRooms,
  buildings,
  panelClass,
  inputClass,
  labelClass
}: Props) {
  const [bookingStep, setBookingStep] = useState<BookingStep>(1)
  const [activeBuildingCode, setActiveBuildingCode] = useState('A1')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [createReservation, setCreateReservation] = useState({
    id: `res-${Date.now()}`,
    day: dayOptions[0].value,
    startTime: '09:00',
    endTime: '10:00'
  })

  const roomsForActiveBuilding = useMemo(
    () => rooms.filter((room) => room.id.startsWith(`${activeBuildingCode}-`)).sort((a, b) => a.id.localeCompare(b.id)),
    [rooms, activeBuildingCode]
  )

  const stepStyles = (step: BookingStep) =>
    bookingStep === step ? 'bg-text-primary text-white' : bookingStep > step ? 'bg-success text-white' : 'bg-white text-text-primary'

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadAvailableRooms({
        day: createReservation.day,
        fromTime: createReservation.startTime,
        toTime: createReservation.endTime
      })
    }, 350)

    return () => clearTimeout(timeout)
  }, [createReservation.day, createReservation.startTime, createReservation.endTime, loadAvailableRooms])

  const createNewReservation = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedRoomId) {
      setMessage('Select room first.')
      return
    }

    run(async () => {
      const startTime = toIsoDateTime(createReservation.day, createReservation.startTime)
      const endTime = toIsoDateTime(createReservation.day, createReservation.endTime)

      if (new Date(startTime) >= new Date(endTime)) {
        setMessage('End time must be later than start time.')
        return
      }

      const result = await bookingApi.createReservation({
        id: createReservation.id,
        roomId: selectedRoomId,
        userId,
        startTime,
        endTime
      })

      setMessage(`Reservation created: ${result.id}`)
      setCreateReservation((prev) => ({ ...prev, id: `res-${Date.now()}` }))
      setBookingStep(1)
      await loadAvailableRooms({
        day: createReservation.day,
        fromTime: createReservation.startTime,
        toTime: createReservation.endTime
      })
    })
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-black uppercase tracking-tight">Booking Wizard</h2>
        <input className="w-[180px] brutal-border bg-white px-3 py-2 text-xs font-semibold" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => loadAvailableRooms({ day: createReservation.day, fromTime: createReservation.startTime, toTime: createReservation.endTime })}>Load available rooms</button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <button type="button" className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(1)}`} onClick={() => setBookingStep(1)}>Step 1 room</button>
        <button type="button" className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(2)}`} onClick={() => setBookingStep(2)}>Step 2 time</button>
        <button type="button" className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(3)}`} onClick={() => setBookingStep(3)}>Step 3 confirm</button>
      </div>

      {bookingStep === 1 ? (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="max-h-[520px] space-y-2 overflow-y-scroll pr-1">
            {buildings.map((building) => (
              <button key={building.code} type="button" className={`w-full brutal-border p-3 text-left ${activeBuildingCode === building.code ? 'bg-brand-accent' : 'bg-white'}`} onClick={() => setActiveBuildingCode(building.code)}>
                <p className="text-sm font-black">{building.code}</p>
                <p className="text-xs font-semibold text-text-muted">{building.name}</p>
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-wider">Select room from {activeBuildingCode}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {roomsForActiveBuilding.length === 0 ? (
                <p className="text-sm font-semibold text-text-muted">No rooms available in this building.</p>
              ) : (
                roomsForActiveBuilding.map((room) => (
                  <button key={room.id} type="button" className={`brutal-border p-4 text-left ${selectedRoomId === room.id ? 'bg-brand-primary text-white' : 'bg-white'}`} onClick={() => { setSelectedRoomId(room.id); setBookingStep(2) }}>
                    <div className="mb-2 h-10 w-10 brutal-border bg-bg-canvas" />
                    <p className="text-lg font-black">{room.id}</p>
                    <p className="text-xs font-semibold">Live room</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {bookingStep === 2 ? (
        <div className="mx-auto max-w-2xl brutal-border bg-bg-canvas p-5">
          <p className="mb-3 text-sm font-black uppercase tracking-wider">Selected room</p>
          <input className={`${inputClass} mb-4`} value={selectedRoomId} readOnly placeholder="Select room in step 1" />
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>Day</label>
              <select className={inputClass} value={createReservation.day} onChange={(event) => setCreateReservation((prev) => ({ ...prev, day: event.target.value }))}>
                {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Start hour</label>
              <select className={inputClass} value={createReservation.startTime} onChange={(event) => setCreateReservation((prev) => ({ ...prev, startTime: event.target.value }))}>
                {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>End hour</label>
              <select className={inputClass} value={createReservation.endTime} onChange={(event) => setCreateReservation((prev) => ({ ...prev, endTime: event.target.value }))}>
                {TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-brutal bg-white py-3" type="button" onClick={() => setBookingStep(1)}>Back</button>
            <button className="btn-brutal bg-text-primary py-3 text-white" type="button" onClick={() => setBookingStep(3)}>Continue</button>
          </div>
        </div>
      ) : null}

      {bookingStep === 3 ? (
        <div className="mx-auto max-w-2xl brutal-border bg-white p-5">
          <p className="mb-3 text-sm font-black uppercase tracking-wider">Confirm reservation</p>
          <div className="space-y-2 text-sm font-semibold">
            <p><span className="font-black">Room:</span> {selectedRoomId || '-'}</p>
            <p><span className="font-black">User:</span> {userId}</p>
            <p><span className="font-black">Day:</span> {createReservation.day}</p>
            <p><span className="font-black">Start:</span> {createReservation.startTime}</p>
            <p><span className="font-black">End:</span> {createReservation.endTime}</p>
          </div>
          <form className="mt-4" onSubmit={createNewReservation}>
            <label className={labelClass}>Reservation ID</label>
            <input className={`${inputClass} mb-4`} value={createReservation.id} onChange={(event) => setCreateReservation((prev) => ({ ...prev, id: event.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-brutal bg-white py-3" type="button" onClick={() => setBookingStep(2)}>Back</button>
              <button className="btn-brutal bg-success py-3 text-white" type="submit">Create booking</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
