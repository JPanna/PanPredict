'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const items = [
  { href: '/',          label: 'Markets' },
  { href: '/new',       label: 'Create'  },
  { href: '/portfolio', label: 'Me'      },    // <- point to /portfolio (works now)
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-okx-border bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/70">
      <div className="mx-auto max-w-screen-sm flex">
        {items.map(({ href, label }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex-1 text-center text-xs py-3',
                'transition-colors',
                active ? 'text-white' : 'text-neutral-400 hover:text-neutral-200',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
