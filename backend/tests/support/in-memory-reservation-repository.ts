import { Reservation } from '@src/modules/reservations/domain/entities/reservation.js'
import type {
  ConsumeCheckInCodeInput,
  ReservationFilter,
  ReservationRepository,
  UpsertCheckInCodeInput
} from '@src/modules/reservations/domain/repositories/reservation-repository.js'
import { hashAccessCode } from '@src/shared/security/check-in-code-hash.js'

export class InMemoryReservationRepository implements ReservationRepository {
  private readonly items = new Map<string, Reservation>()
  private readonly checkInCodes = new Map<
    string,
    { userId: string; pinHash: string; qrHash: string; expiresAt: Date; usedAt: Date | null }
  >()

  private isBlockingStatus(status: Reservation['status']): boolean {
    return status === 'RESERVED' || status === 'OCCUPIED'
  }

  async save(reservation: Reservation): Promise<void> {
    this.items.set(reservation.id, reservation)
  }

  async findByRoomInTimeRange(roomId: string, startTime: Date, endTime: Date): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter(
      (item) =>
        item.roomId === roomId &&
        this.isBlockingStatus(item.status) &&
        item.startTime < endTime &&
        item.endTime > startTime
    )
  }

  async findById(id: string): Promise<Reservation | null> {
    return this.items.get(id) ?? null
  }

  async findByUserId(userId: string): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter((item) => item.userId === userId)
  }

  async findByTimeRange(startTime: Date, endTime: Date): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter(
      (item) => this.isBlockingStatus(item.status) && item.startTime < endTime && item.endTime > startTime
    )
  }

  async findAll(filter: ReservationFilter = {}): Promise<Reservation[]> {
    return Array.from(this.items.values()).filter((item) => {
      if (filter.status && item.status !== filter.status) {
        return false
      }
      if (filter.roomId && item.roomId !== filter.roomId) {
        return false
      }
      if (filter.from && item.startTime < filter.from) {
        return false
      }
      if (filter.to && item.endTime > filter.to) {
        return false
      }
      return true
    })
  }

  async upsertCheckInCode(input: UpsertCheckInCodeInput): Promise<void> {
    this.checkInCodes.set(input.reservationId, {
      userId: input.userId,
      pinHash: input.pinHash,
      qrHash: input.qrHash,
      expiresAt: input.expiresAt,
      usedAt: null
    })
  }

  async consumeCheckInCode(input: ConsumeCheckInCodeInput): Promise<boolean> {
    const code = this.checkInCodes.get(input.reservationId)
    if (!code) return false
    if (code.userId !== input.userId) return false
    if (code.usedAt) return false
    if (code.expiresAt <= input.now) return false

    const codeHash = hashAccessCode(input.code)

    const isCodeMatch = input.method === 'PIN' ? code.pinHash === codeHash : code.qrHash === codeHash
    if (!isCodeMatch) return false

    this.checkInCodes.set(input.reservationId, { ...code, usedAt: input.now })
    return true
  }
}
