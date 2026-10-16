import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import setupSwagger from './configs/swagger.config.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.ENV === 'local') setupSwagger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
