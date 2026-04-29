import { PrismaClient } from "@prisma/client";

import { RoomRepository, Room } from "../../domain/repositories/room-repository.js";

export class PrismaRoomRepository implements RoomRepository  {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Room[]> {
    return this.prisma.room.findMany();
  }

  async findById(id: string): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: { id },
    });
  }

  async save(room: Room): Promise<void> {
    await this.prisma.room.create({
      data: { id: room.id },
    });
  }

  async updateId(currentId: string, nextId: string): Promise<Room | null> {
    try {
      const room = await this.prisma.room.update({
        where: { id: currentId },
        data: { id: nextId },
      });
      return room;
    } catch {
      return null;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.prisma.room.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
