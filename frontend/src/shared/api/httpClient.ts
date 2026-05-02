const DEFAULT_API_BASE_URL = 'http://localhost:3001'
const DEFAULT_TIMEOUT_MS = 10000

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_API_BASE_URL

type ErrorPayload = {
  code?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  backendMessage: string

  constructor(status: number, backendMessage: string, code?: string) {
    super(backendMessage)
    this.status = status
    this.code = code
    this.backendMessage = backendMessage
  }
}

function buildHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers)
  const hasBody = init?.body != null
  const hasContentType = headers.has('Content-Type')

  if (hasBody && !hasContentType) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

function parseErrorPayload(value: unknown): ErrorPayload {
  if (typeof value === 'object' && value !== null) {
    const payload = value as Record<string, unknown>
    return {
      code: typeof payload.code === 'string' ? payload.code : undefined,
      message: typeof payload.message === 'string' ? payload.message : undefined
    }
  }

  return {}
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: buildHeaders(init),
      signal: init?.signal ?? controller.signal
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.', { cause: error })
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const rawPayload = await response.json().catch(() => null)
    const payload = parseErrorPayload(rawPayload)
    throw new ApiError(response.status, payload.message ?? 'Request failed', payload.code)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
