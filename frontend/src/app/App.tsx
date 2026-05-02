import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookingPage } from '../pages/booking/BookingPage'
import { ModeratorPage } from '../pages/moderator/ModeratorPage'
import { RoomsPage } from '../pages/rooms/RoomsPage'
import { plCampusBuildings } from '../data/pl-campus-buildings'
import { useRoomsExplorer, sharedDayOptions } from '../features/rooms-explorer/model/useRoomsExplorer'
import { useAsyncAction } from '../shared/hooks/useAsyncAction'
import type { AppView } from '../shared/types/ui'

export default function App() {
  const [view, setView] = useState<AppView>('BOOKING')
  const [userId, setUserId] = useState('student-1')
  const { loading, message, setMessage, run } = useAsyncAction()

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
  } = useRoomsExplorer(userId, run, setMessage)

  useEffect(() => {
    void loadRooms(adminHeaders)
    void loadAvailableRooms()
  }, [adminHeaders])

  useEffect(() => {
    if (view !== 'MODERATOR') {
      return
    }

    void loadModeratorReservations(adminHeaders, {
      status: '',
      roomId: '',
      from: '',
      to: ''
    })

    const intervalId = window.setInterval(() => {
      void loadModeratorReservations(adminHeaders, {
        status: '',
        roomId: '',
        from: '',
        to: ''
      })
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [view, adminHeaders, loadModeratorReservations])

  const buildingNameByCode = useMemo(
    () => new Map(plCampusBuildings.map((building) => [building.code, building.name])),
    []
  )

  const panelClass = 'bg-bg-surface brutal-border shadow-brutal p-4 sm:p-5 md:p-6'
  const inputClass =
    'w-full brutal-border bg-bg-surface px-3 py-2.5 min-h-11 text-sm font-semibold text-text-primary outline-none focus:bg-brand-accent/20'
  const labelClass = 'mb-1 block text-[11px] font-black tracking-wider uppercase'
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
    <div className="mx-auto min-h-screen w-full max-w-[1500px] p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
      <header className="mb-6 bg-bg-surface brutal-border shadow-brutal p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">Focus Room - Booking System</h1>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {(['BOOKING', 'ROOMS', 'MODERATOR'] as AppView[]).map((item) => (
            <button
              key={item}
              type="button"
              className={`btn-brutal px-3 py-3 text-xs ${view === item ? 'bg-text-primary text-white' : 'bg-white'}`}
              onClick={() => {
                setView(item)
                if (item === 'BOOKING' || item === 'ROOMS') {
                  void loadRooms(adminHeaders)
                  void loadAvailableRooms()
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      <main className="space-y-6">
        <div className={`brutal-border px-4 py-3 text-sm font-semibold ${message.startsWith('Error:') ? 'bg-danger text-white' : 'bg-bg-canvas text-text-primary'}`}>
          {loading ? 'Loading...' : message}
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
            buildings={plCampusBuildings}
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
            rooms={rooms}
            roomsFilter={roomsFilter}
            setRoomsFilter={setRoomsFilter}
            buildingNameByCode={buildingNameByCode}
            buildingOptions={plCampusBuildings}
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
              loadModeratorReservations(adminHeaders, {
                status: '',
                roomId: '',
                from: '',
                to: ''
              })
            }
          />
        ) : null}
      </main>

      <footer className="mt-10 overflow-hidden bg-bg-surface brutal-border shadow-brutal">
        <div className="grid md:grid-cols-[minmax(0,7fr)_minmax(220px,3fr)]">
          <div className="px-5 py-5 md:px-6 md:py-6">
            <p className="text-3xl font-black uppercase leading-none tracking-tight md:text-4xl">BOOKING SYSTEM</p>
            <p className="mt-3 text-sm font-semibold text-text-muted">
              Project & implementation:{' '}
              <a
                className="underline decoration-2 underline-offset-4 transition hover:text-brand-primary"
                href="https://www.linkedin.com/in/nobert-fila/"
                target="_blank"
                rel="noreferrer"
              >
                Norbert Fila
              </a>
            </p>
          </div>

          <a
            className="flex min-h-[140px] items-center justify-center border-t-[3px] border-text-primary bg-brand-accent px-5 py-6 text-center text-sm font-black uppercase tracking-[0.18em] transition hover:bg-brand-primary hover:text-white md:min-h-full md:border-t-0 md:border-l-[3px]"
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
