type Room = {
  id: string;
};

export class InMemoryRoomRepository {
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
}
