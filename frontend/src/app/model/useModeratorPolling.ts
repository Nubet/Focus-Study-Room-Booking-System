import { useEffect } from 'react'
import type { AppView } from '../../shared/types/ui'
import { EMPTY_MODERATOR_RESERVATION_FILTER } from '../../features/moderator/model/reservationFilter'

type LoadModeratorReservations = (
  adminHeaders: HeadersInit,
  filter: { status: string; roomId: string; from: string; to: string }
) => Promise<void>

export function useModeratorPolling(
  view: AppView,
  adminHeaders: HeadersInit,
  loadModeratorReservations: LoadModeratorReservations
) {
  useEffect(() => {
    if (view !== 'MODERATOR') {
      return
    }

    void loadModeratorReservations(adminHeaders, EMPTY_MODERATOR_RESERVATION_FILTER)

    const intervalId = window.setInterval(() => {
      void loadModeratorReservations(adminHeaders, EMPTY_MODERATOR_RESERVATION_FILTER)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [view, adminHeaders, loadModeratorReservations])
}
