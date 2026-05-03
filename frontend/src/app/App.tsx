import { useCallback, useMemo, useState } from 'react'
import { EMPTY_MODERATOR_RESERVATION_FILTER } from '@/features/moderator/model/reservationFilter'
import { sharedDayOptions, useRoomsData } from '@/features/rooms/model/useRoomsData'
import { BookingPage } from '@/pages/booking/BookingPage'
import { ModeratorPage } from '@/pages/moderator/ModeratorPage'
import { MyBookingsPage } from '@/pages/my-bookings/MyBookingsPage'
import { RoomsPage } from '@/pages/rooms/RoomsPage'
import { useAsyncAction } from '@/shared/hooks/useAsyncAction'
import type { AppView } from '@/shared/types/ui'
import { APP_UI_CLASSES, APP_VIEWS } from './config/ui'
import { useBuildingsCatalog } from './model/useBuildingsCatalog'
import { useInitialDataLoad } from './model/useInitialDataLoad'
import { useModeratorPolling } from './model/useModeratorPolling'

export default function App() {
  const [view, setView] = useState<AppView>('BOOKING')
  const [userId, setUserId] = useState('student-1')
  const { loading, message, setMessage, run } = useAsyncAction()
  const { buildings, loadBuildings } = useBuildingsCatalog(run, setMessage)

  const adminHeaders = useMemo(() => ({ 'x-role': 'ADMIN', 'x-user-id': userId }), [userId])

  const {
    rooms,
    availableSet,
    myBookedSet,
    allReservations,
    roomsFilter,
    setRoomsFilter,
    loadRooms,
    loadAvailableRooms,
    loadModeratorReservations
  } = useRoomsData(userId, run, setMessage)

  useInitialDataLoad(adminHeaders, loadBuildings, loadRooms, loadAvailableRooms)
  useModeratorPolling(view, adminHeaders, loadModeratorReservations)

  const buildingNameByCode = useMemo(
    () => new Map(buildings.map((building) => [building.code, building.name])),
    [buildings]
  )

  const { panelClass, inputClass, labelClass } = APP_UI_CLASSES
  const repoUrl = 'https://github.com/Nubet/Focus-Study-Room-Booking-System'

  const loadAvailabilityForRoomsView = useCallback(
    () =>
      void loadAvailableRooms({
        day: roomsFilter.day,
        fromTime: roomsFilter.fromTime,
        toTime: roomsFilter.toTime
      }),
    [loadAvailableRooms, roomsFilter.day, roomsFilter.fromTime, roomsFilter.toTime]
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-375 p-4 sm:p-6 md:p-8 lg:p-10 font-sans">
      <header className="mb-8 u-surface-elevated p-5 sm:p-6 relative">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight u-header-inverse">Focus Room</h1>
          <span className="u-text-hand text-text-muted mt-2 ml-2">Booking System</span>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {APP_VIEWS.map((item) => (
            <button
              key={item}
              type="button"
              className={`btn-primary px-4 py-3 text-sm tracking-wide ${view === item ? 'bg-text-primary text-white' : 'bg-white'}`}
              onClick={() => {
              setView(item)
              if (item === 'BOOKING' || item === 'ROOMS') {
                void loadRooms(adminHeaders)
                void loadAvailableRooms()
              }
              }}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </nav>
      </header>

      <main className="space-y-8">
        <div className={`u-border-strong px-4 py-3 text-sm font-semibold shadow-raised ${message.startsWith('Error:') ? 'bg-status-danger text-white' : 'bg-brand-accent text-text-primary'}`}>
          <span className="u-text-hand mr-2">Note:</span> {loading ? 'Loading...' : message}
        </div>

        {view === 'BOOKING' ? (
          <BookingPage
            userId={userId}
            setUserId={setUserId}
            rooms={rooms}
            dayOptions={sharedDayOptions}
            run={run}
            setMessage={setMessage}
            loadAvailableRooms={loadAvailableRooms}
            buildings={buildings}
            panelClass={panelClass}
            inputClass={inputClass}
            labelClass={labelClass}
          />
        ) : null}

        {view === 'ROOMS' ? (
          <RoomsPage
            panelClass={panelClass}
            inputClass={inputClass}
            labelClass={labelClass}
            userId={userId}
            adminHeaders={adminHeaders}
            rooms={rooms}
            roomsFilter={roomsFilter}
            setRoomsFilter={setRoomsFilter}
            buildingNameByCode={buildingNameByCode}
            buildingOptions={buildings}
            availableSet={availableSet}
            myBookedSet={myBookedSet}
            loadRooms={() => void loadRooms(adminHeaders)}
            loadAvailableRooms={loadAvailabilityForRoomsView}
            dayOptions={sharedDayOptions}
          />
        ) : null}

        {view === 'MODERATOR' ? (
          <ModeratorPage
            panelClass={panelClass}
            inputClass={inputClass}
            adminHeaders={adminHeaders}
            rooms={rooms}
            reservations={allReservations}
            run={run}
            setMessage={setMessage}
            reloadRooms={() => loadRooms(adminHeaders)}
            reloadReservations={() =>
              loadModeratorReservations(adminHeaders, EMPTY_MODERATOR_RESERVATION_FILTER)
            }
          />
        ) : null}

        {view === 'MY_BOOKINGS' ? (
          <MyBookingsPage
            userId={userId}
            run={run}
            setMessage={setMessage}
            panelClass={panelClass}
          />
        ) : null}
      </main>

      <footer className="mt-12 bg-bg-surface u-border-strong shadow-elevated">
        <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(220px,3fr)]">
          <div className="px-5 py-6 md:px-8 md:py-8">
            <p className="text-2xl font-bold tracking-tight md:text-3xl">BOOKING SYSTEM</p>
            <p className="mt-2 text-sm text-text-muted">
              Project & implementation:{' '}
              <a
                className="underline decoration-2 underline-offset-4 transition hover:text-brand-primary font-medium"
                href="https://www.linkedin.com/in/norbert-fila/"
                target="_blank"
                rel="noreferrer"
              >
                Norbert Fila
              </a>
            </p>
          </div>

          <a
            className="flex min-h-35 items-center justify-center border-t-2 border-text-primary bg-brand-accent px-5 py-6 text-center text-sm font-bold uppercase tracking-wider transition hover:bg-brand-primary hover:text-white md:min-h-full md:border-t-0 md:border-l-2"
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Repository
          </a>
        </div>
      </footer>
    </div>
  )
}
