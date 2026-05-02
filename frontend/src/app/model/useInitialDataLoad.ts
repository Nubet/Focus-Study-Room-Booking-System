import { useEffect } from 'react'

type LoadRooms = (adminHeaders: HeadersInit) => Promise<void>
type LoadAvailableRooms = (input?: { day?: string; fromTime?: string; toTime?: string }) => Promise<void>

export function useInitialDataLoad(
  adminHeaders: HeadersInit,
  loadRooms: LoadRooms,
  loadAvailableRooms: LoadAvailableRooms
) {
  useEffect(() => {
    void loadRooms(adminHeaders)
    void loadAvailableRooms()
  }, [adminHeaders, loadRooms, loadAvailableRooms])
}
