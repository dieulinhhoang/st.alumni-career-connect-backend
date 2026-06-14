import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlumniBatch } from './src/database/entities/alumni-batch.entity';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const repo = app.get(getRepositoryToken(AlumniBatch));
  const byNumber = await repo.findOne({ where: { id: 10 } });
  console.log('byNumber:', byNumber);
  const byString = await repo.findOne({ where: { id: '10' as any } });
  console.log('byString:', byString);
  const all = await repo.find();
  console.log('all ids:', all.map(b => [b.id, typeof b.id]));
  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
