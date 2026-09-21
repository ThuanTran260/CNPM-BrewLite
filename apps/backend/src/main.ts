import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix cho toàn bộ route: /api/*
  app.setGlobalPrefix('api');

  // Chặn dữ liệu rác, tự động chuyển đổi DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cấu hình CORS an toàn theo ADR-007
  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [allowedOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 BrewLite Backend running on: http://localhost:${port}/api`);
}

bootstrap();
