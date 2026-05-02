import { ApiError } from './httpClient'

const byErrorCode: Record<string, string> = {
  SLOT_ALREADY_RESERVED: 'This time slot is already reserved. Pick another room or time.',
  RESERVATION_STATE_CONFLICT: 'This reservation cannot be changed in its current state.',
  ROOM_ALREADY_EXISTS: 'Room ID already exists. Choose a different room ID.',
  INVALID_RESERVATION_STATUS_TRANSITION: 'This status change is not allowed for the selected reservation.',
  RESERVATION_NOT_FOUND: 'Reservation was not found. Refresh data and try again.',
  ROOM_NOT_FOUND: 'Room was not found. Refresh data and try again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_PAYLOAD: 'Submitted data is invalid. Check required fields and try again.',
  INVALID_QUERY: 'Filters are invalid. Adjust filters and try again.',
  INVALID_TIME_RANGE: 'Start time must be earlier than end time.',
  INVALID_ACCESS_CODE: 'Access code is invalid.',
  UNEXPECTED_ERROR: 'Server error. Please try again.'
}

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
    if (error.code) {
      const mappedByCode = byErrorCode[error.code]
      if (mappedByCode) return mappedByCode
    }

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
