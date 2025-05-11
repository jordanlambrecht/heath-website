'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export function PoemContentAnimator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // State to ensure component is mounted on the client
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname} // Change in pathname triggers the animation
        // Conditionally apply opacity: 0 until mounted, then let Framer Motion control
        style={{ opacity: isMounted ? undefined : 0 }}
        initial={{ opacity: 0, y: 15 }} // Framer Motion's starting state for animation
        animate={{ opacity: 1, y: 0 }} // Animate to visible
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full md:w-3/4 lg:w-4/5"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
