import { Fragment } from 'react'
import type { ScheduleSlot } from '@/features/rooms/model/availabilitySchedule'
import { TIME_OPTIONS } from '@/shared/constants/time'

type WeekDaySchedule = {
  day: string
  slots: ScheduleSlot[]
}

type Props = {
  selectedRoomId: string
  day: string
  weekSchedule: WeekDaySchedule[]
  loading: boolean
  error: string
}

const slotClassByStatus: Record<string, string> = {
  AVAILABLE: 'bg-status-available',
  BOOKED: 'bg-status-unavailable',
  BOOKED_BY_YOU: 'bg-status-booked-self',
  RELEASED: 'bg-bg-canvas'
}

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  })
}

export function RoomAvailabilitySchedule({
  selectedRoomId,
  day,
  weekSchedule,
  loading,
  error
}: Props) {
  return (
    <div className="mt-4 u-border-strong bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold uppercase tracking-wider">Availability schedule</p>
        {selectedRoomId ? (
          <span className="text-xs font-semibold text-text-muted">{selectedRoomId} on {day}</span>
        ) : null}
      </div>

      {!selectedRoomId ? (
        <p className="text-sm font-semibold text-text-muted">Select a room to view its week schedule.</p>
      ) : loading ? (
        <p className="text-sm font-semibold text-text-muted">Loading schedule...</p>
      ) : error ? (
        <p className="text-sm font-semibold text-status-danger">{error}</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="u-border-strong bg-status-available px-2 py-1">Available</span>
            <span className="u-border-strong bg-status-booked-self px-2 py-1">Booked by you</span>
            <span className="u-border-strong bg-status-unavailable px-2 py-1">Booked</span>
            <span className="u-border-strong bg-bg-canvas px-2 py-1">Released / no-show</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px] u-border-strong bg-white p-2">
              <div className="grid grid-cols-8 gap-1">
                <div className="p-1 text-xs font-bold uppercase tracking-wider text-text-muted">Hour</div>
                {weekSchedule.map((entry) => (
                  <div key={entry.day} className="p-1 text-center text-xs font-bold uppercase tracking-wide text-text-muted">
                    {dayLabel(entry.day)}
                  </div>
                ))}

                {TIME_OPTIONS.slice(0, -1).map((timeLabel, index) => (
                  <Fragment key={timeLabel}>
                    <div className="p-1 text-xs font-semibold text-text-muted">{timeLabel}</div>
                    {weekSchedule.map((entry) => {
                      const slot = entry.slots[index]
                      return (
                        <div
                          key={`${entry.day}-${slot.key}`}
                          className={`h-8 u-border-strong ${slotClassByStatus[slot.status]}`}
                          title={`${entry.day} ${slot.from}-${slot.to}: ${slot.status.replaceAll('_', ' ')}`}
                        />
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
