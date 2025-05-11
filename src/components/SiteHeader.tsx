'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const navItems = [
  { href: '/about', label: 'About' },
  { href: '/poetry', label: 'Poetry' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="bg-background text-text shadow-sm py-4 sticky top-0 z-50 border-b-2">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-primary hover:text-secondary transition-colors"
        >
          Azzo Mulligan
        </Link>
        <nav className="flex gap-6 items-center">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href === '/poetry' && pathname.startsWith('/poetry'))
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`pb-1 hover:text-primary transition-colors ${
                  isActive ? 'text-primary border-b-2 border-primary font-semibold' : 'text-text'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
