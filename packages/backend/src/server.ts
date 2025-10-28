import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { registerRoutes } from './api/routes';
import { initializeServices, Services } from './services/index';

// Extend Fastify instance with services
declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
    io: Server;
  }
}

async function start() {
  const app: FastifyInstance = fastify({
    logger: false, // Use custom logger
  });

  try {
    // Register plugins
    await app.register(cors, {
      origin: config.server.host === 'localhost' ? true : config.server.host,
    });

    // Serve frontend static files in production
    if (process.env.NODE_ENV === 'production') {
      await app.register(staticPlugin, {
        root: path.join(__dirname, '../../frontend/dist'),
        prefix: '/',
      });
    }

    // Initialize services
    const services = await initializeServices();
    app.decorate('services', services);

    // Setup Socket.io
    const io = new Server(app.server, {
      cors: {
        origin: '*',
      },
    });
    app.decorate('io', io);

    // Socket.io connection handler
    io.on('connection', (socket: any) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Register API routes
    await registerRoutes(app);

    // Start server
    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`Server running at http://${config.server.host}:${config.server.port}`);
    logger.info(`WebSocket running at ws://${config.server.host}:${config.server.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGUSR2', () => {
  logger.info('Nodemon restarting...');
  // No need to exit, nodemon will restart the process
});

start();
