import { redirect } from 'next/navigation'
import { COUPLE_SPACE_DEFAULT_TAB } from '@/lib/couple-space'

export default function MonEspacePage() {
  redirect(COUPLE_SPACE_DEFAULT_TAB.href)
}
