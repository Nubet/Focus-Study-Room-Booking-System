import type { Room, RoomRepository } from '@src/modules/rooms/domain/repositories/room-repository.js'

export class InMemoryRoomRepository implements RoomRepository {
  constructor(
    private readonly rooms: Room[] = [
      { id: 'room-a', buildingCode: 'room' },
      { id: 'room-b', buildingCode: 'room' },
      { id: 'room-c', buildingCode: 'room' }
    ]
  ) {}

  async findAll(): Promise<Room[]> {
    return this.rooms
  }

  async findById(id: string): Promise<Room | null> {
    return this.rooms.find((room) => room.id === id) ?? null
  }

  async save(room: Room): Promise<void> {
    this.rooms.push(room)
  }

  async updateId(currentId: string, nextId: string): Promise<Room | null> {
    const room = this.rooms.find((item) => item.id === currentId)
    if (!room) {
      return null
    }

    room.id = nextId
    room.buildingCode = nextId.split('-')[0] ?? room.buildingCode
    return room
  }

  async deleteById(id: string): Promise<boolean> {
    const index = this.rooms.findIndex((room) => room.id === id)
    if (index === -1) {
      return false
    }

    this.rooms.splice(index, 1)
    return true
  }
}
