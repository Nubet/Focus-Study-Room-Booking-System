const apiBase = 'http://localhost:3001'

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(payload.message ?? 'Request failed')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
