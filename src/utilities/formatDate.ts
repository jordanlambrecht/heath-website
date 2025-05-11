import { format, formatDistanceToNowStrict, differenceInMonths, isValid } from 'date-fns'

export function formatRelativeDate(dateString: string | number | Date): string {
  const date = new Date(dateString)

  if (!isValid(date)) {
    return 'Invalid date'
  }

  const now = new Date()
  const monthsDifference = differenceInMonths(now, date)

  if (monthsDifference < 1) {
    // Less than a month ago, format relatively
    // formatDistanceToNowStrict provides "X days ago", "X weeks ago" etc.
    // We add 'ago' as formatDistanceToNowStrict doesn't always include it for all locales/units
    return `${formatDistanceToNowStrict(date)} ago`
  } else {
    // A month or more ago, format as "Month Day(th/st/nd/rd), Year"
    // Example: "February 14th, 2025"
    return format(date, 'MMMM do, yyyy')
  }
}
