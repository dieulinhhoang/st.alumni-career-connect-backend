import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createDatabase } from 'typeorm-extension';
import { SeedService } from './database/seed/seed.service';

async function bootstrap() {
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

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [ 'http://localhost:5173'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
if (process.env.RUN_SEED === 'true') {
    const seedService = app.get(SeedService);
    await seedService.run();
  }

  const port = 8000;
  await app.listen(port, '127.0.0.1');
}
bootstrap();