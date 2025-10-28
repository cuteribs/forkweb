import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Services } from '../../services';
import type {
  FileNode,
  ApiResponse,
  PullRequest,
  PushRequest,
} from '@forkweb/shared';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@forkweb/shared';

export class FileController {
  constructor(private services: Services) {}

  async tree(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { ref?: string };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { ref = 'HEAD' } = request.query;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      const tree = await this.services.git.tree(repository.path, ref);

      const response: ApiResponse<FileNode[]> = {
        success: true,
        data: tree,
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        (error as Error).message,
        400
      );
    }
  }

  async blob(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { path: string; ref?: string };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { path, ref = 'HEAD' } = request.query;

    if (!path) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'File path is required',
        400
      );
    }

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      const content = await this.services.git.readFile(
        repository.path,
        path,
        ref
      );

      const response: ApiResponse<{ content: string }> = {
        success: true,
        data: { content },
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        `File not found: ${path}`,
        404
      );
    }
  }
}

export class RemoteController {
  constructor(private services: Services) {}

  async fetch(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: { remote?: string };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { remote = 'origin' } = request.query;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      await this.services.git.fetch(repository.path, remote);

      // Invalidate cache
      this.services.invalidator.invalidateAfter('fetch', repository.path);

      const response: ApiResponse = {
        success: true,
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        (error as Error).message,
        400
      );
    }
  }

  async pull(
    request: FastifyRequest<{
      Params: { id: string };
      Body: PullRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { remote = 'origin', branch, rebase = false } = request.body;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      await this.services.git.pull(repository.path, {
        remote,
        branch,
        rebase,
      });

      // Invalidate cache
      this.services.invalidator.invalidateAfter('pull', repository.path);

      const response: ApiResponse = {
        success: true,
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        (error as Error).message,
        400
      );
    }
  }

  async push(
    request: FastifyRequest<{
      Params: { id: string };
      Body: PushRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const {
      remote = 'origin',
      branch,
      force = false,
    } = request.body;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      await this.services.git.push(repository.path, {
        remote,
        branch,
        force,
      });

      // Invalidate cache
      this.services.invalidator.invalidateAfter('push', repository.path);

      const response: ApiResponse = {
        success: true,
        timestamp: Date.now(),
      };

      return reply.send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        (error as Error).message,
        400
      );
    }
  }
}
