import { Module } from '@nestjs/common';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  imports: [],
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
