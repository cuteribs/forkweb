import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Services } from '../../services';
import type {
  Commit,
  LogOptions,
  ApiResponse,
  PaginatedResponse,
} from '@forkweb/shared';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@forkweb/shared';

export class CommitController {
  constructor(private services: Services) {}

  async list(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: {
        branch?: string;
        limit?: number;
        skip?: number;
        author?: string;
        path?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { branch, limit = 50, skip = 0, author, path } = request.query;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    const options: LogOptions = {
      branch,
      maxCount: limit,
      skip,
      author,
      path,
    };

    const commits = await this.services.git.log(repository.path, options);

    const response: ApiResponse<PaginatedResponse<Commit>> = {
      success: true,
      data: {
        items: commits,
        total: commits.length,
        page: Math.floor(skip / limit),
        pageSize: limit,
        hasMore: commits.length === limit,
      },
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async get(
    request: FastifyRequest<{ Params: { id: string; sha: string } }>,
    reply: FastifyReply
  ) {
    const { id, sha } = request.params;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      const commit = await this.services.git.show(repository.path, sha);

      const response: ApiResponse<Commit> = {
        success: true,
        data: commit,
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        `Commit not found: ${sha}`,
        404
      );
    }
  }
}
