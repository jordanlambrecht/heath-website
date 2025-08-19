import NotFoundClient from '@/components/NotFoundClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Oopsies',
  description: 'Oops. The page you are looking for does not exist.',
}

export default function NotFound() {
  // Server component wrapper — renders the client-only `NotFoundClient` which
  // handles router interactions and analytics. Keeping this file a server
  // component ensures Next can render the 404 UI when `notFound()` is called
  // from server code.
  return <NotFoundClient />
}
