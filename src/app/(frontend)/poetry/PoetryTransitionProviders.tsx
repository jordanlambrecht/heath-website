'use client'

import React from 'react'
import { TransitionRouter } from 'next-transition-router'
import { animate } from 'framer-motion'

export function PoetryTransitionProviders({ children }: { children: React.ReactNode }) {
  const pageContentSelector = '#poetry-page-content-wrapper'
  return (
    <TransitionRouter
      leave={async (next, fromPath, toPath) => {
        if (fromPath === toPath || !toPath) {
          next()
          return
        }

        const element = document.querySelector(pageContentSelector) as HTMLElement | null
        if (element) {
          const animation = animate(
            element,
            { opacity: 0, y: -15 },
            { duration: 0.3, ease: 'easeInOut' },
          )
          await animation.then(next)
        } else {
          next()
        }
      }}
      enter={async (next, fromPath, toPath) => {
        if (fromPath === toPath && fromPath !== undefined) {
          const el = document.querySelector(pageContentSelector) as HTMLElement | null
          if (el) {
            el.style.opacity = '1'
            el.style.transform = 'translateY(0px)'
          }
          next()
          return
        }

        const element = document.querySelector(pageContentSelector) as HTMLElement | null
        if (element) {
          element.style.opacity = '0'
          element.style.transform = 'translateY(15px)'

          const animation = animate(
            element,
            { opacity: 1, y: 0 },
            { duration: 0.3, ease: 'easeInOut' },
          )
          await animation.then(() => {
            if (element) {
              // Re-check element as it might be null if component unmounted fast
              element.style.opacity = ''
              element.style.transform = ''
            }
            next()
          })
        } else {
          next()
        }
      }}
    >
      {children}
    </TransitionRouter>
  )
}
