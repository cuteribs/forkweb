import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import { errorHandler } from '../middleware/errorHandler';
import { registerRepositoryRoutes } from './repositories';
import { registerCommitRoutes } from './commits';
import { registerBranchRoutes } from './branches';
import { registerChangeRoutes } from './changes';
import { registerFileRoutes } from './files';

export async function registerRoutes(app: FastifyInstance) {
  // Get services from app decorator
  const services = (app as any).services as Services;

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Health check endpoint
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: Date.now(),
      cache: services.cache.getStats(),
    };
  });

  // Register all route modules
  await registerRepositoryRoutes(app, services);
  await registerCommitRoutes(app, services);
  await registerBranchRoutes(app, services);
  await registerChangeRoutes(app, services);
  await registerFileRoutes(app, services);
}
