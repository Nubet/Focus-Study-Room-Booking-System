import { PrismaClient } from '@prisma/client'
import type { Building, BuildingRepository } from '../../domain/repositories/building-repository.js'

export class PrismaBuildingRepository implements BuildingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Building[]> {
    return this.prisma.building.findMany({ orderBy: { code: 'asc' } })
  }

  async findByCode(code: string): Promise<Building | null> {
    return this.prisma.building.findUnique({ where: { code } })
  }

  async save(building: Building): Promise<void> {
    await this.prisma.building.create({ data: building })
  }
}
