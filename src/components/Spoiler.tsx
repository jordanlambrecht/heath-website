'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type SpoilerProps = {
  buttonText?: string
  children: React.ReactNode
}

const Spoiler = ({ buttonText = 'Analysis', children }: SpoilerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const contentId = `spoiler-content-${buttonText.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer text-secondary hover:text-primary font-semibold py-2 focus:outline-none transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {isOpen ? 'Hide' : 'Show'} {buttonText}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            key="content" // Important for AnimatePresence to track the element
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-3 overflow-hidden"
          >
            {/* Inner div for padding, so height animation works smoothly */}
            <div className="p-4 border border-gray-200 dark:border-slate-700 rounded bg-background">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Spoiler
