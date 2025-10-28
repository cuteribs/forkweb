import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services';
import type { CreateBranchRequest, CheckoutRequest } from '@forkweb/shared';
import { BranchController } from '../controllers';
import { asyncHandler } from '../middleware';

export async function registerBranchRoutes(
  app: FastifyInstance,
  services: Services
) {
  const controller = new BranchController(services);

  // List branches
  app.get<{ Params: { id: string } }>(
    '/api/repositories/:id/branches',
    asyncHandler(controller.list.bind(controller))
  );

  // Create branch
  app.post<{ Params: { id: string }; Body: CreateBranchRequest }>(
    '/api/repositories/:id/branches',
    asyncHandler(controller.create.bind(controller))
  );

  // Delete branch
  app.delete<{ Params: { id: string; name: string }; Querystring: { force?: boolean } }>(
    '/api/repositories/:id/branches/:name',
    asyncHandler(controller.delete.bind(controller))
  );

  // Checkout branch
  app.post<{ Params: { id: string }; Body: CheckoutRequest }>(
    '/api/repositories/:id/checkout',
    asyncHandler(controller.checkout.bind(controller))
  );
}
