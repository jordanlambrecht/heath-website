'use client'

import { useEffect } from 'react'
import { usePlausible } from 'next-plausible'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const plausible = usePlausible()
  const router = useRouter()

  useEffect(() => {
    console.error(error)

    plausible('Error', {
      props: {
        errorMessage: error.message,
        errorName: error.name,
        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        errorUrl: typeof window !== 'undefined' ? window.location.pathname : '',
        errorTimestamp: new Date().toISOString(),
      },
    })
  }, [error, plausible])

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 py-16 text-center">
      <h1 className="mb-4 text-6xl font-bold">☠️ Error</h1>
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-2 text-gray-700 dark:text-gray-300">Error: {error.name}</p>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        So sorry about that. Egg on my face, I guess.
      </p>
      <div className="flex space-x-4">
        <Button
          variant="default"
          size="default"
          className="text-lg px-6 py-3 rounded-sm"
          onClick={handleGoBack}
        >
          Go Back
        </Button>
        <Button
          variant="outline"
          size="default"
          className="text-lg px-6 py-3 rounded-sm"
          onClick={() => reset()}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
