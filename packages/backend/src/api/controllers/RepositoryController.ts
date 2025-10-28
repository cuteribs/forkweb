import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Services } from '../../services';
import type {
  Repository,
  ApiResponse,
} from '@forkweb/shared';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@forkweb/shared';

export class RepositoryController {
  constructor(private services: Services) {}

  async list(_request: FastifyRequest, reply: FastifyReply) {
    const repositories = await this.services.repository.list();

    const response: ApiResponse<Repository[]> = {
      success: true,
      data: repositories,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async get(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    const response: ApiResponse<Repository> = {
      success: true,
      data: repository,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async add(
    request: FastifyRequest<{ Body: { path: string } }>,
    reply: FastifyReply
  ) {
    const { path } = request.body;

    if (!path) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Repository path is required',
        400
      );
    }

    try {
      const repository = await this.services.repository.add(path);

      // Start watching the repository
      this.services.watcher.watchRepository(repository.path);

      const response: ApiResponse<Repository> = {
        success: true,
        data: repository,
        timestamp: Date.now(),
      };

      return reply.status(201).send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.REPO_INVALID,
        (error as Error).message,
        400
      );
    }
  }

  async remove(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    // Stop watching
    this.services.watcher.unwatchRepository(repository.path);

    await this.services.repository.remove(id);

    const response: ApiResponse = {
      success: true,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async refresh(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const repository = await this.services.repository.refresh(id);

    const response: ApiResponse<Repository> = {
      success: true,
      data: repository,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }
}
