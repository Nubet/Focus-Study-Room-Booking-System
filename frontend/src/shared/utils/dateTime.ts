export const toDayValue = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toIsoDateTime = (day: string, time: string): string =>
  new Date(`${day}T${time}:00`).toISOString()

export const buildDayOptions = (count: number): Array<{ value: string; label: string }> =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + i)
    const value = toDayValue(date)
    const label = date.toLocaleDateString('pl-PL', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    })
    return { value, label }
  })

export const isValidRange = (startIso: string, endIso: string): boolean =>
  new Date(startIso) < new Date(endIso)
