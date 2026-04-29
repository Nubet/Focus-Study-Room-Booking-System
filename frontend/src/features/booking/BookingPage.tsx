import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { bookingApi } from './api/booking.api'
import { TIME_OPTIONS } from '../../shared/constants/time'
import { toIsoDateTime } from '../../shared/utils/dateTime'
import { splitRoomId } from '../../shared/utils/roomId'
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

  const startTimeOptions = useMemo(() => {
    const endIndex = TIME_OPTIONS.indexOf(createReservation.endTime)
    if (endIndex <= 0) return TIME_OPTIONS.slice(0, -1)
    return TIME_OPTIONS.slice(0, endIndex)
  }, [createReservation.endTime])

  const endTimeOptions = useMemo(() => {
    const startIndex = TIME_OPTIONS.indexOf(createReservation.startTime)
    if (startIndex === -1 || startIndex >= TIME_OPTIONS.length - 1) return TIME_OPTIONS.slice(1)
    return TIME_OPTIONS.slice(startIndex + 1)
  }, [createReservation.startTime])

  const stepStyles = (step: BookingStep) =>
    bookingStep === step ? 'bg-text-primary text-white' : bookingStep > step ? 'bg-success text-white' : 'bg-white text-text-primary'

  const canOpenStep2 = Boolean(selectedRoomId)
  const canOpenStep3 = Boolean(selectedRoomId)

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

  const goToStep2 = () => {
    if (!canOpenStep2) {
      setMessage('Complete step 1 first: select a room.')
      return
    }
    setBookingStep(2)
  }

  const goToStep3 = () => {
    if (!canOpenStep3) {
      setMessage('Complete step 1 first: select a room.')
      return
    }
    setBookingStep(3)
  }

  return (
    <section className={panelClass}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-black uppercase tracking-tight">Booking Wizard</h2>
        <div className="flex items-center gap-2 bg-bg-canvas px-3 py-1 brutal-border">
          <label htmlFor="simulate-login" className="text-xs font-bold uppercase tracking-wider text-text-muted">Simulate login as:</label>
          <input id="simulate-login" className="w-[140px] brutal-border bg-white px-2 py-1 text-xs font-semibold" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
        </div>
        <button className="btn-brutal bg-bg-canvas px-3 py-2 text-xs" type="button" onClick={() => loadAvailableRooms({ day: createReservation.day, fromTime: createReservation.startTime, toTime: createReservation.endTime })}>Load available rooms</button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <button type="button" className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(1)}`} onClick={() => setBookingStep(1)}>Step 1 room</button>
        <button
          type="button"
          className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(2)} ${canOpenStep2 ? '' : 'opacity-60 cursor-not-allowed'}`}
          onClick={goToStep2}
          disabled={!canOpenStep2}
        >
          {canOpenStep2 ? 'Step 2 time' : 'Step 2 locked'}
        </button>
        <button
          type="button"
          className={`brutal-border py-2 text-xs font-black uppercase ${stepStyles(3)} ${canOpenStep3 ? '' : 'opacity-60 cursor-not-allowed'}`}
          onClick={goToStep3}
          disabled={!canOpenStep3}
        >
          {canOpenStep3 ? 'Step 3 confirm' : 'Step 3 locked'}
        </button>
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
                    <p className="text-lg font-black">
                      <span className={selectedRoomId === room.id ? 'text-white' : 'text-brand-primary'}>{splitRoomId(room.id).buildingCode}</span>
                      <span>-</span>
                      <span className={selectedRoomId === room.id ? 'text-white' : 'text-danger'}>{splitRoomId(room.id).roomNumber}</span>
                    </p>
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
          <label className={labelClass}>Selected room (locked)</label>
          <input
            className={`${inputClass} mb-4 cursor-not-allowed bg-neutral/20`}
            value={selectedRoomId}
            readOnly
            disabled
            placeholder="Select room in step 1"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelClass}>Day</label>
              <select className={inputClass} value={createReservation.day} onChange={(event) => setCreateReservation((prev) => ({ ...prev, day: event.target.value }))}>
                {dayOptions.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Start hour</label>
              <select
                className={inputClass}
                value={createReservation.startTime}
                onChange={(event) => {
                  const nextStart = event.target.value
                  setCreateReservation((prev) => {
                    const nextEnd = nextStart >= prev.endTime ? TIME_OPTIONS[TIME_OPTIONS.indexOf(nextStart) + 1] : prev.endTime
                    return { ...prev, startTime: nextStart, endTime: nextEnd }
                  })
                }}
              >
                {startTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>End hour</label>
              <select
                className={inputClass}
                value={createReservation.endTime}
                onChange={(event) => {
                  const nextEnd = event.target.value
                  setCreateReservation((prev) => {
                    const nextStart = nextEnd <= prev.startTime ? TIME_OPTIONS[TIME_OPTIONS.indexOf(nextEnd) - 1] : prev.startTime
                    return { ...prev, startTime: nextStart, endTime: nextEnd }
                  })
                }}
              >
                {endTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="btn-brutal bg-white py-3" type="button" onClick={() => setBookingStep(1)}>Back</button>
            <button className="btn-brutal bg-text-primary py-3 text-white" type="button" onClick={goToStep3}>Continue</button>
          </div>
        </div>
      ) : null}

      {bookingStep === 3 ? (
        <div className="mx-auto max-w-lg brutal-border bg-white shadow-brutal">
          <div className="border-b-[3px] border-dashed border-text-primary bg-brand-accent p-6 text-center">
            <h3 className="text-2xl font-black uppercase tracking-widest text-text-primary">Booking Ticket</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-text-muted">Final Confirmation</p>
          </div>
          <div className="p-6 space-y-5 bg-bg-canvas">
            <div className="flex justify-between border-b-[3px] border-text-primary pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Room</p>
                <p className="text-2xl font-black text-brand-primary leading-none mt-1">{selectedRoomId || '-'}</p>
                <p className="text-xs font-bold text-text-primary mt-1 max-w-[200px] leading-tight">
                  {selectedRoomId && (buildings.find((b) => b.code === splitRoomId(selectedRoomId).buildingCode)?.name || 'Unknown building')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">User</p>
                <p className="text-lg font-black leading-none mt-1">{userId}</p>
              </div>
            </div>
            <div className="flex justify-between border-b-[3px] border-text-primary pb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Date</p>
                <p className="text-lg font-black leading-none mt-1">{createReservation.day}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">Time Window</p>
                <p className="text-lg font-black leading-none mt-1">{createReservation.startTime} - {createReservation.endTime}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm font-black uppercase tracking-wider">Total Duration</p>
              <div className="brutal-border bg-brand-primary px-3 py-1 text-lg font-black text-white">
                {parseInt(createReservation.endTime, 10) - parseInt(createReservation.startTime, 10)} {parseInt(createReservation.endTime, 10) - parseInt(createReservation.startTime, 10) === 1 ? 'HR' : 'HRS'}
              </div>
            </div>
          </div>
          <div className="border-t-[3px] border-dashed border-text-primary p-6 bg-white">
            <form onSubmit={createNewReservation}>
              <div className="mb-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Internal ID (Auto-generated)</p>
                <p className="font-mono text-xs font-semibold text-text-primary mt-1">{createReservation.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-brutal bg-bg-canvas py-3 font-black uppercase tracking-wider" type="button" onClick={() => setBookingStep(2)}>Back</button>
                <button className="btn-brutal bg-success py-3 text-white font-black uppercase tracking-wider hover:brightness-110" type="submit">Confirm & Book</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
