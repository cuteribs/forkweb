import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import { CommitController } from '../controllers';
import { asyncHandler } from '../middleware';

export async function registerCommitRoutes(
  app: FastifyInstance,
  services: Services
) {
  const controller = new CommitController(services);

  // List commits
  app.get<{
    Params: { id: string };
    Querystring: {
      branch?: string;
      limit?: number;
      skip?: number;
      author?: string;
      path?: string;
    };
  }>(
    '/api/repositories/:id/commits',
    asyncHandler(controller.list.bind(controller))
  );

  // Get commit by SHA
  app.get<{ Params: { id: string; sha: string } }>(
    '/api/repositories/:id/commits/:sha',
    asyncHandler(controller.get.bind(controller))
  );
}
