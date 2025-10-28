import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';

// Async handler wrapper to catch errors
export function asyncHandler<T extends RouteGenericInterface = RouteGenericInterface>(
  handler: (request: FastifyRequest<T>, reply: FastifyReply) => Promise<any>
) {
  return async (request: FastifyRequest<T>, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (error) {
      request.log.error(error);
      throw error;
    }
  };
}
