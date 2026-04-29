import { ApiError } from './httpClient'

const byBackendMessage: Record<string, string> = {
  'Slot already reserved': 'This time slot is already reserved. Pick another room or time.',
  'Reservation state conflict': 'This reservation cannot be changed in its current state.',
  'Room already exists': 'Room ID already exists. Choose a different room ID.',
  'Invalid reservation status transition': 'This status change is not allowed for the selected reservation.',
  'Reservation not found': 'Reservation was not found. Refresh data and try again.',
  'Room not found': 'Room was not found. Refresh data and try again.',
  Forbidden: 'You do not have permission to perform this action.',
  'Invalid payload': 'Submitted data is invalid. Check required fields and try again.',
  'Invalid query': 'Filters are invalid. Adjust filters and try again.',
  'startTime must be before endTime': 'Start time must be earlier than end time.',
  'Invalid access code': 'Access code is invalid.',
  'Unexpected error': 'Server error. Please try again.'
}

export const mapApiErrorToMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    const mapped = byBackendMessage[error.backendMessage]
    if (mapped) return mapped

    if (error.status === 409) return 'Conflict detected. Refresh data and try again.'
    if (error.status === 404) return 'Requested resource was not found.'
    if (error.status === 403) return 'Action is forbidden for your role.'
    if (error.status >= 500) return 'Server error. Please try again.'
    return error.backendMessage
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}
