import { useCallback, useState } from 'react'
import type { Building } from '@/entities/building/model/types'
import { roomsApi } from '@/features/rooms/api/rooms.api'
import type { AsyncActionRunner } from '@/shared/hooks/useAsyncAction'

export function useBuildingsCatalog(run: AsyncActionRunner, setMessage: (value: string) => void) {
  const [buildings, setBuildings] = useState<Building[]>([])

  const loadBuildings = useCallback(async () => {
    await run(async () => {
      const result = await roomsApi.getBuildings()
      setBuildings(result)
      setMessage(`Loaded ${result.length} buildings.`)
    })
  }, [run, setMessage])

  return {
    buildings,
    loadBuildings
  }
}
