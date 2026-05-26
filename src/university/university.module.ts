import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty])],
  controllers: [UniversityController],
  providers: [UniversityService],
})
export class UniversityModule {}
