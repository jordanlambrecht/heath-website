// filepath: /Users/jordanlambrecht/dev-local/heath-website/src/components/NewFooter.tsx
import React from 'react'

export function NewFooter() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="text-left flex flex-row justify-start py-8 ">
      <div className="container">
        <p className="text-foreground">&copy; {currentYear}. 🤠 Heath Johnston.</p>
      </div>
    </footer>
  )
}
