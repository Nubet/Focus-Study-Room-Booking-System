import { useEffect } from 'react'

type LoadRooms = (adminHeaders: HeadersInit) => Promise<void>
type LoadAvailableRooms = (input?: { day?: string; fromTime?: string; toTime?: string }) => Promise<void>
type LoadBuildings = () => Promise<void>

export function useInitialDataLoad(
  adminHeaders: HeadersInit,
  loadBuildings: LoadBuildings,
  loadRooms: LoadRooms,
  loadAvailableRooms: LoadAvailableRooms
) {
  useEffect(() => {
    void loadBuildings()
    void loadRooms(adminHeaders)
    void loadAvailableRooms()
  }, [adminHeaders, loadBuildings, loadRooms, loadAvailableRooms])
}
