import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Services } from '../../services';
import type {
  GitStatus,
  ApiResponse,
  StageFilesRequest,
  UnstageFilesRequest,
  DiscardChangesRequest,
  CreateCommitRequest,
} from '@forkweb/shared';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@forkweb/shared';

export class ChangeController {
  constructor(private services: Services) {}

  async status(
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

    const status = await this.services.git.status(repository.path);

    const response: ApiResponse<GitStatus> = {
      success: true,
      data: status,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async stage(
    request: FastifyRequest<{
      Params: { id: string };
      Body: StageFilesRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { files } = request.body;

    if (!files || files.length === 0) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Files array is required',
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
      await this.services.git.stage(repository.path, files);

      // Invalidate cache
      this.services.invalidator.invalidateAfter('stage', repository.path);

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

  async unstage(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UnstageFilesRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { files } = request.body;

    if (!files || files.length === 0) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Files array is required',
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
      await this.services.git.unstage(repository.path, files);

      // Invalidate cache
      this.services.invalidator.invalidateAfter('unstage', repository.path);

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

  async discard(
    request: FastifyRequest<{
      Params: { id: string };
      Body: DiscardChangesRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { files } = request.body;

    if (!files || files.length === 0) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Files array is required',
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
      // Use checkout to discard changes
      await this.services.git.checkout(repository.path, '--');

      // Invalidate cache
      this.services.invalidator.invalidateAfter('discard', repository.path);

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

  async commit(
    request: FastifyRequest<{
      Params: { id: string };
      Body: CreateCommitRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { message, amend = false } = request.body;

    if (!message) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Commit message is required',
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
      const commitSha = await this.services.git.commit(
        repository.path,
        message,
        { amend }
      );

      // Invalidate cache
      this.services.invalidator.invalidateAfter('commit', repository.path);

      const response: ApiResponse<{ sha: string }> = {
        success: true,
        data: { sha: commitSha },
        timestamp: Date.now(),
      };

      return reply.status(201).send(response);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.GIT_ERROR,
        (error as Error).message,
        400
      );
    }
  }

  async diff(
    request: FastifyRequest<{
      Params: { id: string };
      Querystring: {
        path?: string;
        staged?: boolean;
        context?: number;
      };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { path, staged = false, context = 3 } = request.query;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    const diff = await this.services.git.diff(repository.path, {
      path,
      staged,
      context,
    });

    const response: ApiResponse = {
      success: true,
      data: diff,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }
}
