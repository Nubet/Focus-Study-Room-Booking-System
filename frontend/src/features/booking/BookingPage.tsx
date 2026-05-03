import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Room } from '@/entities/room/model/types'
import type { AsyncActionRunner } from '@/shared/hooks/useAsyncAction'
import { TIME_OPTIONS } from '@/shared/constants/time'
import type { BookingStep } from '@/shared/types/ui'
import { toIsoDateTime } from '@/shared/utils/dateTime'
import { splitRoomId } from '@/shared/utils/roomId'
import { bookingApi } from '@/features/booking/api/booking.api'

type Building = { code: string; name: string }

type ReservationDraft = {
  id: string
  day: string
  startTime: string
  endTime: string
}

type Props = {
  userId: string
  setUserId: (value: string) => void
  rooms: Room[]
  dayOptions: Array<{ value: string; label: string }>
  run: AsyncActionRunner
  setMessage: (value: string) => void
  loadAvailableRooms: (input?: { day?: string; fromTime?: string; toTime?: string }) => Promise<void>
  buildings: Building[]
  panelClass: string
  inputClass: string
  labelClass: string
}

function getDurationHours(startTime: string, endTime: string): number {
  const startHour = Number(startTime.split(':')[0])
  const endHour = Number(endTime.split(':')[0])
  return endHour - startHour
}

function createReservationId(): string {
  return `res-${Date.now()}`
}

function BookingStepNavigation({
  bookingStep,
  canOpenStep2,
  canOpenStep3,
  onSelectStep,
  onOpenStep2,
  onOpenStep3
}: {
  bookingStep: BookingStep
  canOpenStep2: boolean
  canOpenStep3: boolean
  onSelectStep: (step: BookingStep) => void
  onOpenStep2: () => void
  onOpenStep3: () => void
}) {
  const stepStyles = (step: BookingStep) => {
    if (bookingStep === step) return 'bg-text-primary text-white'
    if (bookingStep > step) return 'bg-status-success text-white'
    return 'bg-white text-text-primary'
  }

  return (
    <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
      <button type="button" className={`u-border-strong py-3 text-xs font-bold uppercase sm:py-2 ${stepStyles(1)}`} onClick={() => onSelectStep(1)}>Step 1 room</button>
      <button
        type="button"
        className={`u-border-strong py-3 text-xs font-bold uppercase sm:py-2 ${stepStyles(2)} ${canOpenStep2 ? '' : 'cursor-not-allowed opacity-60'}`}
        onClick={onOpenStep2}
        disabled={!canOpenStep2}
      >
        {canOpenStep2 ? 'Step 2 time' : 'Step 2 locked'}
      </button>
      <button
        type="button"
        className={`u-border-strong py-3 text-xs font-bold uppercase sm:py-2 ${stepStyles(3)} ${canOpenStep3 ? '' : 'cursor-not-allowed opacity-60'}`}
        onClick={onOpenStep3}
        disabled={!canOpenStep3}
      >
        {canOpenStep3 ? 'Step 3 confirm' : 'Step 3 locked'}
      </button>
    </div>
  )
}

function RoomSelectionStep({
  buildings,
  roomsForActiveBuilding,
  selectedRoomId,
  activeBuildingCode,
  setActiveBuildingCode,
  onSelectRoom
}: {
  buildings: Building[]
  roomsForActiveBuilding: Room[]
  selectedRoomId: string
  activeBuildingCode: string
  setActiveBuildingCode: (value: string) => void
  onSelectRoom: (roomId: string) => void
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1 lg:max-h-130">
        {buildings.map((building) => (
          <button key={building.code} type="button" className={`w-full u-border-strong p-3 text-left ${activeBuildingCode === building.code ? 'bg-brand-accent' : 'bg-white'}`} onClick={() => setActiveBuildingCode(building.code)}>
            <p className="text-sm font-bold">{building.code}</p>
            <p className="text-xs font-semibold text-text-muted">{building.name}</p>
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-bold uppercase tracking-wider">Select room from {activeBuildingCode}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {roomsForActiveBuilding.length === 0 ? (
            <p className="text-sm font-semibold text-text-muted">No rooms available in this building.</p>
          ) : (
            roomsForActiveBuilding.map((room) => {
              const { buildingCode, roomNumber } = splitRoomId(room.id)
              const isSelected = selectedRoomId === room.id
              return (
                <button key={room.id} type="button" className={`u-border-strong p-4 text-left ${isSelected ? 'bg-brand-primary text-white' : 'bg-white'}`} onClick={() => onSelectRoom(room.id)}>
                  <div className="mb-2 h-10 w-10 u-border-strong bg-bg-canvas" />
                  <p className="text-lg font-bold">
                    <span className={isSelected ? 'text-white' : 'text-brand-primary'}>{buildingCode}</span>
                    <span>-</span>
                    <span className={isSelected ? 'text-white' : 'text-status-danger'}>{roomNumber}</span>
                  </p>
                  <p className="text-xs font-semibold">Live room</p>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function TimeSelectionStep({
  selectedRoomId,
  createReservation,
  dayOptions,
  startTimeOptions,
  endTimeOptions,
  inputClass,
  labelClass,
  setCreateReservation,
  onBack,
  onContinue
}: {
  selectedRoomId: string
  createReservation: ReservationDraft
  dayOptions: Array<{ value: string; label: string }>
  startTimeOptions: string[]
  endTimeOptions: string[]
  inputClass: string
  labelClass: string
  setCreateReservation: Dispatch<SetStateAction<ReservationDraft>>
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl u-border-strong bg-bg-canvas p-4 sm:p-5">
      <p className="mb-3 text-sm font-bold uppercase tracking-wider">Selected room</p>
      <label className={labelClass}>Selected room (locked)</label>
      <input className={`${inputClass} mb-4 cursor-not-allowed bg-border-default/20`} value={selectedRoomId} readOnly disabled placeholder="Select room in step 1" />
      <div className="grid gap-3 sm:grid-cols-3">
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
        <button className="btn-primary min-h-11 bg-white py-3" type="button" onClick={onBack}>Back</button>
        <button className="btn-primary min-h-11 bg-text-primary py-3 text-white" type="button" onClick={onContinue}>Continue</button>
      </div>
    </div>
  )
}

function ConfirmationStep({
  selectedRoomId,
  userId,
  buildings,
  createReservation,
  onBack,
  onConfirm
}: {
  selectedRoomId: string
  userId: string
  buildings: Building[]
  createReservation: ReservationDraft
  onBack: () => void
  onConfirm: (event: FormEvent) => void
}) {
  const durationHours = getDurationHours(createReservation.startTime, createReservation.endTime)
  const selectedBuildingName = selectedRoomId
    ? buildings.find((building) => building.code === splitRoomId(selectedRoomId).buildingCode)?.name ?? 'Unknown building'
    : '-'

  return (
    <div className="mx-auto max-w-lg u-surface-elevated bg-white">
      <div className="border-b-[3px] border-dashed border-text-primary bg-brand-accent p-4 text-center sm:p-6">
        <h3 className="text-xl font-bold uppercase tracking-widest text-text-primary sm:text-2xl">Booking Ticket</h3>
        <p className="mt-1 text-sm font-semibold tracking-wide text-text-muted sm:text-xs">Final Confirmation</p>
      </div>
      <div className="space-y-4 bg-bg-canvas p-4 sm:space-y-5 sm:p-6">
        <div className="flex flex-wrap justify-between gap-4 border-b-[3px] border-text-primary pb-4 sm:flex-nowrap">
          <div className="w-full sm:w-auto">
            <p className="text-sm font-semibold tracking-wide text-text-muted">Room</p>
            <p className="mt-1 text-xl font-bold leading-none text-brand-primary sm:text-2xl">{selectedRoomId || '-'}</p>
            <p className="mt-1 text-xs font-bold leading-tight text-text-primary sm:max-w-50">{selectedBuildingName}</p>
          </div>
          <div className="w-full sm:w-auto sm:text-right">
            <p className="text-sm font-semibold tracking-wide text-text-muted">User</p>
            <p className="mt-1 text-lg font-bold leading-none">{userId}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-b-[3px] border-text-primary pb-4 sm:flex-nowrap">
          <div className="w-full sm:w-auto">
            <p className="text-sm font-semibold tracking-wide text-text-muted">Date</p>
            <p className="mt-1 text-lg font-bold leading-none">{createReservation.day}</p>
          </div>
          <div className="w-full sm:w-auto sm:text-right">
            <p className="text-sm font-semibold tracking-wide text-text-muted">Time Window</p>
            <p className="mt-1 text-lg font-bold leading-none">{createReservation.startTime} - {createReservation.endTime}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-bold uppercase tracking-wider">Total Duration</p>
          <div className="u-border-strong bg-brand-primary px-3 py-1 text-lg font-bold text-white">
            {durationHours} {durationHours === 1 ? 'HR' : 'HRS'}
          </div>
        </div>
      </div>
      <div className="border-t-[3px] border-dashed border-text-primary bg-white p-4 sm:p-6">
        <form onSubmit={onConfirm}>
          <div className="mb-5 text-center">
            <p className="text-sm font-semibold tracking-wide text-text-muted">Internal ID (Auto-generated)</p>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-text-primary">{createReservation.id}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary min-h-11 bg-bg-canvas py-3 text-sm font-semibold tracking-wide sm:text-sm" type="button" onClick={onBack}>Back</button>
            <button className="btn-primary min-h-11 bg-status-success py-3 text-sm font-semibold tracking-wide text-white hover:brightness-110 sm:text-sm" type="submit">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  )
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
  const [activeBuildingCode, setActiveBuildingCode] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [createReservation, setCreateReservation] = useState<ReservationDraft>(() => ({
    id: createReservationId(),
    day: dayOptions[0].value,
    startTime: '09:00',
    endTime: '10:00'
  }))

  const resolvedActiveBuildingCode = useMemo(() => {
    const hasActiveBuilding = buildings.some((building) => building.code === activeBuildingCode)
    if (hasActiveBuilding) {
      return activeBuildingCode
    }
    return buildings[0]?.code ?? ''
  }, [activeBuildingCode, buildings])

  const roomsForActiveBuilding = useMemo(
    () => rooms.filter((room) => room.id.startsWith(`${resolvedActiveBuildingCode}-`)).sort((a, b) => a.id.localeCompare(b.id)),
    [rooms, resolvedActiveBuildingCode]
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

    void run(async () => {
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
      setCreateReservation((prev) => ({ ...prev, id: createReservationId() }))
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
      <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <h2 className="mr-auto text-2xl font-bold uppercase tracking-tight">Booking Wizard</h2>
        <div className="flex w-full items-center gap-2 u-border-strong bg-bg-canvas px-3 py-1 sm:w-auto">
          <label htmlFor="simulate-login" className="whitespace-nowrap text-sm font-semibold tracking-wide text-text-muted">Simulate login as:</label>
          <input id="simulate-login" className="min-h-11 w-full u-border-strong bg-white px-2 py-1 text-xs font-semibold sm:min-h-0 sm:w-35" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" />
        </div>
        <button className="btn-primary min-h-11 w-full bg-bg-canvas px-3 py-2 text-xs sm:min-h-0 sm:w-auto" type="button" onClick={() => void loadAvailableRooms({ day: createReservation.day, fromTime: createReservation.startTime, toTime: createReservation.endTime })}>Load available rooms</button>
      </div>

      <BookingStepNavigation
        bookingStep={bookingStep}
        canOpenStep2={canOpenStep2}
        canOpenStep3={canOpenStep3}
        onSelectStep={setBookingStep}
        onOpenStep2={goToStep2}
        onOpenStep3={goToStep3}
      />

      {bookingStep === 1 ? (
        <RoomSelectionStep
          buildings={buildings}
          roomsForActiveBuilding={roomsForActiveBuilding}
          selectedRoomId={selectedRoomId}
          activeBuildingCode={resolvedActiveBuildingCode}
          setActiveBuildingCode={setActiveBuildingCode}
          onSelectRoom={(roomId) => {
            setSelectedRoomId(roomId)
            setBookingStep(2)
          }}
        />
      ) : null}

      {bookingStep === 2 ? (
        <TimeSelectionStep
          selectedRoomId={selectedRoomId}
          createReservation={createReservation}
          dayOptions={dayOptions}
          startTimeOptions={startTimeOptions}
          endTimeOptions={endTimeOptions}
          inputClass={inputClass}
          labelClass={labelClass}
          setCreateReservation={setCreateReservation}
          onBack={() => setBookingStep(1)}
          onContinue={goToStep3}
        />
      ) : null}

      {bookingStep === 3 ? (
        <ConfirmationStep
          selectedRoomId={selectedRoomId}
          userId={userId}
          buildings={buildings}
          createReservation={createReservation}
          onBack={() => setBookingStep(2)}
          onConfirm={createNewReservation}
        />
      ) : null}
    </section>
  )
}
