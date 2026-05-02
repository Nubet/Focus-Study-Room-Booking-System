import { useCallback, useState } from 'react'
import { mapApiErrorToMessage } from '../api/mapApiErrorToMessage'

export type AsyncActionRunner = <T>(action: () => Promise<T>) => Promise<T | undefined>

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)
  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState('Ready.')

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    try {
      setLoading(true)
      return await action()
    } catch (error) {
      const text = mapApiErrorToMessage(error)
      setMessage(`Error: ${text}`)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  const runWithKey = useCallback(async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    try {
      setLoadingByKey((prev) => ({ ...prev, [key]: true }))
      return await action()
    } catch (error) {
      const text = mapApiErrorToMessage(error)
      setMessage(`Error: ${text}`)
      return undefined
    } finally {
      setLoadingByKey((prev) => ({ ...prev, [key]: false }))
    }
  }, [])

  return { loading, loadingByKey, message, setMessage, run, runWithKey }
}
