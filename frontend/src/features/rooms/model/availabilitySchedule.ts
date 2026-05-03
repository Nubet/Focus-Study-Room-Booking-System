import type { Reservation } from '@/entities/reservation/model/types'

const HOUR_LABELS = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0'))

type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BOOKED_BY_YOU' | 'RELEASED'

export type ScheduleSlot = {
  key: string
  from: string
  to: string
  status: SlotStatus
  reservations: Reservation[]
}

export type DaySchedule = {
  day: string
  slots: ScheduleSlot[]
}

const BLOCKING_STATUSES = new Set(['RESERVED', 'OCCUPIED', 'COMPLETED'])

function toLocalDate(day: string, hourLabel: string): Date {
  return new Date(`${day}T${hourLabel}:00:00`)
}

function isOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA
}

function getSlotStatus(reservations: Reservation[], userId: string): SlotStatus {
  if (reservations.length === 0) return 'AVAILABLE'

  const blockingReservations = reservations.filter((reservation) => BLOCKING_STATUSES.has(reservation.status))
  if (blockingReservations.length === 0) return 'RELEASED'

  if (blockingReservations.some((reservation) => reservation.userId === userId)) return 'BOOKED_BY_YOU'
  return 'BOOKED'
}

function buildRoomDaySchedule(day: string, reservations: Reservation[], userId: string): ScheduleSlot[] {
  return HOUR_LABELS.map((fromHour) => {
    const fromDate = toLocalDate(day, fromHour)
    const toDate = new Date(fromDate)
    toDate.setHours(toDate.getHours() + 1)

    const slotReservations = reservations.filter((reservation) => {
      const reservationStart = new Date(reservation.startTime)
      const reservationEnd = new Date(reservation.endTime)
      return isOverlapping(fromDate, toDate, reservationStart, reservationEnd)
    })

    return {
      key: `${fromHour}:00`,
      from: `${fromHour}:00`,
      to: `${String(toDate.getHours()).padStart(2, '0')}:00`,
      status: getSlotStatus(slotReservations, userId),
      reservations: slotReservations
    }
  })
}

export function buildRoomWeekSchedule(
  startDay: string,
  reservations: Reservation[],
  userId: string,
  dayCount = 7
): DaySchedule[] {
  const start = new Date(`${startDay}T00:00:00`)

  return Array.from({ length: dayCount }, (_, offset) => {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dayValue = `${year}-${month}-${day}`

    return {
      day: dayValue,
      slots: buildRoomDaySchedule(dayValue, reservations, userId)
    }
  })
}
