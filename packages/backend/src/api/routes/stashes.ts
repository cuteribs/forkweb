import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import { asyncHandler } from '../middleware';

export async function registerStashRoutes(
  app: FastifyInstance,
  services: Services
) {
  // List stashes
  app.get<{ Params: { id: string } }>(
    '/api/repositories/:id/stashes',
    asyncHandler(async (req, reply) => {
      const { id } = req.params;
      const repo = await services.repository.get(id);
      
      if (!repo) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repository not found',
          },
        });
      }

      const stashes = await services.git.getStashes(repo.path);
      
      return reply.send({
        success: true,
        data: stashes,
      });
    })
  );
}
