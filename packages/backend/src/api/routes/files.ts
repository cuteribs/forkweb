import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import type { PullRequest, PushRequest } from '@forkweb/shared';
import { FileController, RemoteController } from '../controllers';
import { asyncHandler } from '../middleware';

export async function registerFileRoutes(
  app: FastifyInstance,
  services: Services
) {
  const fileController = new FileController(services);
  const remoteController = new RemoteController(services);

  // Get file tree
  app.get<{ Params: { id: string }; Querystring: { ref?: string } }>(
    '/api/repositories/:id/tree',
    asyncHandler(fileController.tree.bind(fileController))
  );

  // Get file content
  app.get<{ Params: { id: string }; Querystring: { path: string; ref?: string } }>(
    '/api/repositories/:id/blob',
    asyncHandler(fileController.blob.bind(fileController))
  );

  // Fetch from remote
  app.post<{ Params: { id: string }; Querystring: { remote?: string } }>(
    '/api/repositories/:id/fetch',
    asyncHandler(remoteController.fetch.bind(remoteController))
  );

  // Pull from remote
  app.post<{ Params: { id: string }; Body: PullRequest }>(
    '/api/repositories/:id/pull',
    asyncHandler(remoteController.pull.bind(remoteController))
  );

  // Push to remote
  app.post<{ Params: { id: string }; Body: PushRequest }>(
    '/api/repositories/:id/push',
    asyncHandler(remoteController.push.bind(remoteController))
  );
}
