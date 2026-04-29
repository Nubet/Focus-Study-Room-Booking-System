const apiBase = 'http://localhost:3001'

export class ApiError extends Error {
  status: number
  backendMessage: string

  constructor(status: number, backendMessage: string) {
    super(backendMessage)
    this.status = status
    this.backendMessage = backendMessage
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new ApiError(response.status, payload.message ?? 'Request failed')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
