import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './workers/workers.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  app.enableShutdownHooks();
}

bootstrap();
