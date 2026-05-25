import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultyController } from './faculty.controller';
import { FacultyService } from './faculty.service';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty])],
  controllers: [FacultyController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
