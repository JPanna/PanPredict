// app/me/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import MeClient from './MeClient'

export default function MePage() {
  return <MeClient />
}
