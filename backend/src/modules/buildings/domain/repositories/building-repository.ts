export type Building = {
  code: string
  name: string
}

export interface BuildingRepository {
  findAll(): Promise<Building[]>
  findByCode(code: string): Promise<Building | null>
  save(building: Building): Promise<void>
}
