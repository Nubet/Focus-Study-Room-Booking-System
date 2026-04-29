export const DAY_RANGE = 7

export const TIME_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 7
  return `${String(hour).padStart(2, '0')}:00`
})
