import { differenceInDays, differenceInMonths, differenceInYears, parseISO, addMonths, addYears } from 'date-fns'

export function calcAge(dob: string, at: string): string {
  const birth = parseISO(dob)
  const target = parseISO(at)

  if (target < birth) return 'Before birth'

  const years = differenceInYears(target, birth)
  const afterYears = addYears(birth, years)
  const months = differenceInMonths(target, afterYears)
  const afterMonths = addMonths(afterYears, months)
  const days = differenceInDays(target, afterMonths)

  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)

  return parts.join(' ')
}

export function formatDateDisplay(dateStr: string): string {
  return parseISO(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}
