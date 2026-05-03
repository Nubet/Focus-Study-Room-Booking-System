import { useEffect, useMemo, useState } from 'react'
import type { ScheduleSlot } from '@/features/rooms/model/availabilitySchedule'
import { buildRoomWeekSchedule } from '@/features/rooms/model/availabilitySchedule'
import { roomsApi } from '@/features/rooms/api/rooms.api'
import { toIsoDateTime } from '@/shared/utils/dateTime'
import type { Reservation } from '@/entities/reservation/model/types'

type UseRoomWeeklyScheduleInput = {
  selectedRoomId: string
  day: string
  userId: string
  adminHeaders: HeadersInit
}

type WeekDaySchedule = {
  day: string
  slots: ScheduleSlot[]
}

export function useRoomWeeklySchedule({
  selectedRoomId,
  day,
  userId,
  adminHeaders
}: UseRoomWeeklyScheduleInput) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedRoomId) {
      setReservations([])
      setError('')
      setLoading(false)
      return
    }

    const from = toIsoDateTime(day, '00:00')
    const weekEnd = new Date(from)
    weekEnd.setDate(weekEnd.getDate() + 7)

    setLoading(true)
    setError('')

    void roomsApi
      .getRoomReservationsForRange(
        {
          roomId: selectedRoomId,
          from,
          to: weekEnd.toISOString()
        },
        adminHeaders
      )
      .then((result) => {
        setReservations(result)
      })
      .catch(() => {
        setReservations([])
        setError('Could not load room schedule for this week.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [adminHeaders, day, selectedRoomId])

  const weekSchedule: WeekDaySchedule[] = useMemo(
    () => buildRoomWeekSchedule(day, reservations, userId),
    [day, reservations, userId]
  )

  return {
    weekSchedule,
    loading,
    error
  }
}
