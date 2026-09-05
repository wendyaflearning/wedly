import type { APIRequestContext } from '@playwright/test'

export const mockApiUrl = 'http://127.0.0.1:4010'

export type CapturedMockRequest = {
  token: string
  method: string
  path: string
  body: {
    step: string
    data: Record<string, unknown>
  }
}

export async function resetMockApi(request: APIRequestContext) {
  const response = await request.post(`${mockApiUrl}/__mock/reset`)
  if (!response.ok()) {
    throw new Error(`Unable to reset mock API: ${response.status()}`)
  }
}

export async function getCapturedRequests(request: APIRequestContext): Promise<CapturedMockRequest[]> {
  const response = await request.get(`${mockApiUrl}/__mock/requests`)
  if (!response.ok()) {
    throw new Error(`Unable to read mock API requests: ${response.status()}`)
  }
  return response.json()
}
