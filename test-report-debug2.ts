import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ReportsService } from './src/reports/reports.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const service = app.get(ReportsService);

  const adminUser: any = { id: 1, name: 'Admin', isAdmin: true, facultyId: null };
  const result: any = await service.buildReport({ surveyId: '8', facultyId: '1' }, adminUser);
  console.log('majorRows:', result.majorRows.length);
  console.log('responseRows:', result.responseRows.length);
  console.log('graduateRows:', result.graduateRows.length);

  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
