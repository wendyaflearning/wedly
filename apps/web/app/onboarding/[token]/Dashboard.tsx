'use client'
import type { OnboardingData } from './types'

export default function Dashboard({
  data,
  token,
}: {
  data: OnboardingData
  token: string
}) {
  return <div>Dashboard — {data.firstname}</div>
}
