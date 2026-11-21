const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '')

export function apiUrl(path: `/${string}`): string {
  return `${API_BASE_URL}${path}`
}

export async function fetchApi(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const callerSignal = init.signal
  const abortHandler = () => controller.abort(callerSignal?.reason)

  if (callerSignal?.aborted) {
    abortHandler()
  } else {
    callerSignal?.addEventListener('abort', abortHandler, { once: true })
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (timedOut) {
      throw new Error('A solicitação excedeu o tempo limite. Tente novamente.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
    callerSignal?.removeEventListener('abort', abortHandler)
  }
}
