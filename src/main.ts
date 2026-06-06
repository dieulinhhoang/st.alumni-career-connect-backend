import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './database/seed/seed.service';
import 'dotenv/config';

// Bắt unhandled error từ mysql2 connection (typeorm-extension emit 'error' không có listener)
process.on('uncaughtException', (err: any) => {
  if (
    err?.message?.includes('connection is in closed state') ||
    err?.message?.includes('ECONNREFUSED') ||
    err?.fatal === true
  ) {
    console.warn('[mysql2] Ignored connection error during startup:', err.message);
    return; // không crash
  }
  console.error('[uncaughtException]', err);
  process.exit(1);
});

async function bootstrap() {
  // Thử tạo DB nếu chưa có — bỏ qua lỗi nếu DB đã tồn tại hoặc không kết nối được
  try {
    const { createDatabase } = await import('typeorm-extension');
    await createDatabase({
      ifNotExist: true,
      options: {
        type: 'mysql',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      },
    });
  } catch (err: any) {
    console.warn('[createDatabase] Skipped:', err?.message ?? err);
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  if (process.env.RUN_SEED === 'true') {
    try {
      const seedService = app.get(SeedService);
      await seedService.run();
    } catch (err: any) {
      console.warn('[seed] Skipped:', err?.message ?? err);
    }
  }

  const port = 8000;
  await app.listen(port, '127.0.0.1');
}

bootstrap();