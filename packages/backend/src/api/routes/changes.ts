import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import type {
  StageFilesRequest,
  UnstageFilesRequest,
  DiscardChangesRequest,
  CreateCommitRequest,
} from '@forkweb/shared';
import { ChangeController } from '../controllers';
import { asyncHandler } from '../middleware';

export async function registerChangeRoutes(
  app: FastifyInstance,
  services: Services
) {
  const controller = new ChangeController(services);

  // Get repository status
  app.get<{ Params: { id: string } }>(
    '/api/repositories/:id/status',
    asyncHandler(controller.status.bind(controller))
  );

  // Get diff
  app.get<{
    Params: { id: string };
    Querystring: { path?: string; staged?: boolean; context?: number };
  }>(
    '/api/repositories/:id/diff',
    asyncHandler(controller.diff.bind(controller))
  );

  // Stage files
  app.post<{ Params: { id: string }; Body: StageFilesRequest }>(
    '/api/repositories/:id/stage',
    asyncHandler(controller.stage.bind(controller))
  );

  // Unstage files
  app.post<{ Params: { id: string }; Body: UnstageFilesRequest }>(
    '/api/repositories/:id/unstage',
    asyncHandler(controller.unstage.bind(controller))
  );

  // Discard changes
  app.post<{ Params: { id: string }; Body: DiscardChangesRequest }>(
    '/api/repositories/:id/discard',
    asyncHandler(controller.discard.bind(controller))
  );

  // Create commit
  app.post<{ Params: { id: string }; Body: CreateCommitRequest }>(
    '/api/repositories/:id/commit',
    asyncHandler(controller.commit.bind(controller))
  );
}
