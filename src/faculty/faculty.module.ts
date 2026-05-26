import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultiesController } from './faculties.controller';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Faculty])],
  controllers: [FacultyController, FacultiesController],
  providers: [FacultyService],
  exports: [FacultyService],
})
export class FacultyModule {}
