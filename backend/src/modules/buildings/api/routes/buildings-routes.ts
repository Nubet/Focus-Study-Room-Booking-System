import type { FastifyInstance } from 'fastify'
import type { BuildingRepository } from '../../domain/repositories/building-repository.js'

export const registerBuildingsRoutes = (
  app: FastifyInstance,
  buildingRepository: BuildingRepository
): void => {
  app.get(
    '/buildings',
    {
      schema: {
        tags: ['buildings'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              required: ['code', 'name'],
              properties: {
                code: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (_request, reply) => {
      const buildings = await buildingRepository.findAll()
      return reply.status(200).send(buildings)
    }
  )
}
