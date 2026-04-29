export type Room = {
  id: string;
};

export interface RoomRepository {
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | null>;
  save(room: Room): Promise<void>;
  updateId(currentId: string, nextId: string): Promise<Room | null>;
  deleteById(id: string): Promise<boolean>;
}
