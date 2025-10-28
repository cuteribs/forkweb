import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Services } from '../../services';
import type {
  Branch,
  ApiResponse,
  CreateBranchRequest,
  CheckoutRequest,
} from '@forkweb/shared';
import { AppError } from '../middleware/errorHandler';
import { ERROR_CODES } from '@forkweb/shared';

export class BranchController {
  constructor(private services: Services) {}

  async list(
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

    const branches = await this.services.git.branches(repository.path);

    const response: ApiResponse<Branch[]> = {
      success: true,
      data: branches,
      timestamp: Date.now(),
    };

    return reply.send(response);
  }

  async create(
    request: FastifyRequest<{
      Params: { id: string };
      Body: CreateBranchRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { name, startPoint, checkout } = request.body;

    if (!name) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Branch name is required',
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
      await this.services.git.createBranch(
        repository.path,
        name,
        startPoint
      );

      // Invalidate cache
      this.services.invalidator.invalidateAfter('branch:create', repository.path);

      // Checkout if requested
      if (checkout) {
        await this.services.git.checkout(repository.path, name);
        this.services.invalidator.invalidateAfter('checkout', repository.path);
      }

      const response: ApiResponse = {
        success: true,
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

  async delete(
    request: FastifyRequest<{
      Params: { id: string; name: string };
      Querystring: { force?: boolean };
    }>,
    reply: FastifyReply
  ) {
    const { id, name } = request.params;
    const { force = false } = request.query;

    const repository = await this.services.repository.get(id);
    if (!repository) {
      throw new AppError(
        ERROR_CODES.REPO_NOT_FOUND,
        `Repository not found: ${id}`,
        404
      );
    }

    try {
      await this.services.git.deleteBranch(repository.path, name, force);

      // Invalidate cache
      this.services.invalidator.invalidateAfter('branch:delete', repository.path);

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

  async checkout(
    request: FastifyRequest<{
      Params: { id: string };
      Body: CheckoutRequest;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { branch, commit, createBranch } = request.body;

    if (!branch && !commit) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        'Branch or commit is required',
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
      const target = branch || commit!;
      
      if (createBranch && branch) {
        await this.services.git.createBranch(repository.path, branch);
      } else {
        await this.services.git.checkout(repository.path, target);
      }

      // Invalidate cache
      this.services.invalidator.invalidateAfter('checkout', repository.path);

      // Update repository current branch
      await this.services.repository.refresh(id);

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
