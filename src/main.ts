import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createDatabase } from 'typeorm-extension';

async function bootstrap() {
  await createDatabase({
    ifNotExist: true,
    options: {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT? parseInt(process.env.DB_PORT) : 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
  });
  const app = await NestFactory.create(AppModule);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
