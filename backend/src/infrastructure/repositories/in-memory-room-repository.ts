type Room = {
  id: string;
};

export class InMemoryRoomRepository {
  constructor(private readonly rooms: Room[] = [{ id: "room-a" }, { id: "room-b" }, { id: "room-c" }]) {}

  async findAll(): Promise<Room[]> {
    return this.rooms;
  }
}
