// /src/app/not-found.tsx
'use client'
import { usePlausible } from 'next-plausible'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const plausible = usePlausible()
  const router = useRouter()
  const [path, setPath] = useState<string | null>(null)

  useEffect(() => {
    const currentPath = window.location.pathname
    setPath(currentPath)

    plausible('404-page', {
      props: {
        notFoundPath: currentPath,
        notFoundReferrer: document.referrer || 'direct',
      },
    })
  }, [plausible])

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 mt-12 text-center ">
      <h1 className="mb-4 text-6xl font-bold">☠️ 404</h1>
      <h2 className="mb-6 text-2xl">Page Not Found</h2>
      {path && (
        <p className="mb-4 text-gray-500 text-md dark:text-gray-400">
          The requested path:{' '}
          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">{path}</code>{' '}
          was not found.
        </p>
      )}
      <p className="max-w-md mb-8 text-lg text-primary">
        The page you&apos;re looking for doesn&apos;t exist.
        <br /> There&apos;s probably a metaphor in there somewhere.
      </p>
      <Button variant="default" size="lg" onClick={handleGoBack}>
        Go Back
      </Button>
    </div>
  )
}
