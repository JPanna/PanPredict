// app/portfolio/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import PortfolioClient from './PortfolioClient'

export default function PortfolioPage() {
  return <PortfolioClient />
}
