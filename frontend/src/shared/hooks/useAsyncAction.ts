import { useCallback, useState } from 'react'

export function useAsyncAction() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Ready.')

  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      setLoading(true)
      await action()
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`Error: ${text}`)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, message, setMessage, run }
}
