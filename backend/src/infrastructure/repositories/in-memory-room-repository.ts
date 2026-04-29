
import { RoomRepository, Room } from "../../domain/repositories/room-repository.js";

export class InMemoryRoomRepository implements RoomRepository {
  constructor(private readonly rooms: Room[] = [{ id: "room-a" }, { id: "room-b" }, { id: "room-c" }]) {}

  async findAll(): Promise<Room[]> {
    return this.rooms;
  }

  async findById(id: string): Promise<Room | null> {
    const room = this.rooms.find((item) => item.id === id);
    return room ?? null;
  }

  async save(room: Room): Promise<void> {
    this.rooms.push(room);
  }

  async updateId(currentId: string, nextId: string): Promise<Room | null> {
    const room = this.rooms.find((item) => item.id === currentId);

    if (!room) {
      return null;
    }

    room.id = nextId;
    return room;
  }

  async deleteById(id: string): Promise<boolean> {
    const index = this.rooms.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    this.rooms.splice(index, 1);
    return true;
  }
}
