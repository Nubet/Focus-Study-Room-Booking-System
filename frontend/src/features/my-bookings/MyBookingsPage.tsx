import { useCallback, useEffect, useMemo, useState } from 'react'
import { bookingApi } from '@/features/booking/api/booking.api'
import type { Reservation } from '@/entities/reservation/model/types'
import type { AsyncActionRunner } from '@/shared/hooks/useAsyncAction'
import QRCode from 'qrcode'

type Props = {
  userId: string
  run: AsyncActionRunner
  setMessage: (value: string) => void
  panelClass: string
}

type AccessCodeState = {
  pin: string
  qrPayload: string
  qrImageDataUrl: string
  expiresAt: string
}

const cancellableStatuses = new Set(['RESERVED', 'OCCUPIED'])

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export function MyBookingsPage({ userId, run, setMessage, panelClass }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [expandedReservationId, setExpandedReservationId] = useState<string | null>(null)
  const [accessCodesByReservationId, setAccessCodesByReservationId] = useState<Record<string, AccessCodeState>>({})

  const sortedReservations = useMemo(
    () => [...reservations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [reservations]
  )

  const loadMyReservations = useCallback(async () => {
    await run(async () => {
      const result = await bookingApi.getMyReservations(userId)
      setReservations(result)
      setMessage(`Loaded ${result.length} of your reservations.`)
    })
  }, [run, setMessage, userId])

  useEffect(() => {
    void loadMyReservations()
  }, [loadMyReservations])

  const cancelReservation = (reservationId: string) => {
    void run(async () => {
      await bookingApi.cancelReservation(reservationId)
      setReservations((prev) => prev.map((item) => (item.id === reservationId ? { ...item, status: 'CANCELLED' } : item)))
      setMessage(`Reservation cancelled: ${reservationId}`)
    })
  }

  const toggleAccessCodes = (reservation: Reservation) => {
    if (expandedReservationId === reservation.id) {
      setExpandedReservationId(null)
      return
    }

    void run(async () => {
      const accessCodes = await bookingApi.getAccessCodes(reservation.id, userId)
      const qrImageDataUrl = await QRCode.toDataURL(accessCodes.qrPayload, { margin: 1, width: 260 })

      setAccessCodesByReservationId((prev) => ({
        ...prev,
        [reservation.id]: {
          pin: accessCodes.pin,
          qrPayload: accessCodes.qrPayload,
          qrImageDataUrl,
          expiresAt: accessCodes.expiresAt
        }
      }))
      setExpandedReservationId(reservation.id)
      setMessage(`Access codes prepared for ${reservation.id}.`)
    })
  }

  return (
    <section className={panelClass}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <h2 className="mr-auto text-2xl font-bold uppercase tracking-tight">My Bookings</h2>
        <div className="u-border-strong bg-bg-canvas px-3 py-2 text-sm font-semibold">User: {userId}</div>
        <button className="btn-primary min-h-11 bg-bg-canvas px-4 py-2 text-sm" type="button" onClick={() => void loadMyReservations()}>
          Refresh list
        </button>
      </div>

      {sortedReservations.length === 0 ? (
        <div className="u-border-strong bg-white p-4 text-sm font-semibold text-text-muted">No reservations for this user yet.</div>
      ) : (
        <div className="space-y-3">
          {sortedReservations.map((reservation) => {
            const canCancel = cancellableStatuses.has(reservation.status)

            return (
              <article key={reservation.id} className="u-border-strong bg-white p-4">
                <div className="mb-3 flex flex-wrap items-start gap-2">
                  <p className="mr-auto font-mono text-xs font-bold text-text-muted">{reservation.id}</p>
                  <span className={`u-border-strong px-2 py-1 text-xs font-bold ${reservation.status === 'CANCELLED' ? 'bg-border-default' : reservation.status === 'COMPLETED' ? 'bg-status-success text-white' : 'bg-brand-accent'}`}>
                    {reservation.status}
                  </span>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="font-semibold">Room:</span> {reservation.roomId}</p>
                  <p><span className="font-semibold">User:</span> {reservation.userId}</p>
                  <p><span className="font-semibold">From:</span> {formatDateTime(reservation.startTime)}</p>
                  <p><span className="font-semibold">To:</span> {formatDateTime(reservation.endTime)}</p>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`btn-primary min-h-11 px-4 py-2 text-sm ${canCancel ? 'bg-status-danger text-white' : 'bg-border-default text-text-muted'}`}
                      type="button"
                      disabled={!canCancel}
                      onClick={() => cancelReservation(reservation.id)}
                    >
                      {canCancel ? 'Cancel reservation' : 'Cannot cancel'}
                    </button>
                    <button
                      className="btn-primary min-h-11 bg-bg-canvas px-4 py-2 text-sm"
                      type="button"
                      onClick={() => toggleAccessCodes(reservation)}
                    >
                      {expandedReservationId === reservation.id ? 'Hide PIN and QR' : 'Show PIN and QR'}
                    </button>
                  </div>

                  {expandedReservationId === reservation.id && accessCodesByReservationId[reservation.id] ? (
                    <div className="mt-3 u-border-strong bg-bg-canvas p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider">Check-in access</p>
                      <p className="mb-2 text-sm"><span className="font-semibold">PIN:</span> {accessCodesByReservationId[reservation.id].pin}</p>
                      <img
                        className="u-border-strong bg-white p-2"
                        src={accessCodesByReservationId[reservation.id].qrImageDataUrl}
                        alt={`Check-in QR for ${reservation.id}`}
                      />
                      <p className="mt-2 text-xs text-text-muted">QR expires at: {formatDateTime(accessCodesByReservationId[reservation.id].expiresAt)}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
