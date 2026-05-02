import type { Building, BuildingRepository } from '@src/modules/buildings/domain/repositories/building-repository.js'

export class InMemoryBuildingRepository implements BuildingRepository {
  constructor(
    private readonly buildings: Building[] = [
      { code: 'room', name: 'Legacy Test Building' },
      { code: 'A2', name: 'Faculty of Biotechnology and Food Sciences' },
      { code: 'A16', name: 'International Faculty of Engineering' }
    ]
  ) {}

  async findAll(): Promise<Building[]> {
    return this.buildings
  }

  async findByCode(code: string): Promise<Building | null> {
    return this.buildings.find((building) => building.code === code) ?? null
  }

  async save(building: Building): Promise<void> {
    this.buildings.push(building)
  }
}
