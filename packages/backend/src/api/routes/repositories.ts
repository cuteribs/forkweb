import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import { RepositoryController } from '../controllers';
import { asyncHandler } from '../middleware';

export async function registerRepositoryRoutes(
  app: FastifyInstance,
  services: Services
) {
  const controller = new RepositoryController(services);

  // List all repositories
  app.get('/api/repositories', asyncHandler(controller.list.bind(controller)));

  // Get repository by ID
  app.get<{ Params: { id: string } }>(
    '/api/repositories/:id',
    asyncHandler(controller.get.bind(controller))
  );

  // Add new repository
  app.post<{ Body: { path: string } }>(
    '/api/repositories',
    asyncHandler(controller.add.bind(controller))
  );

  // Remove repository
  app.delete<{ Params: { id: string } }>(
    '/api/repositories/:id',
    asyncHandler(controller.remove.bind(controller))
  );

  // Refresh repository
  app.post<{ Params: { id: string } }>(
    '/api/repositories/:id/refresh',
    asyncHandler(controller.refresh.bind(controller))
  );
}
