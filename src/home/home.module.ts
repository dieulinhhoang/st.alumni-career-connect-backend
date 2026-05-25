import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Enterprise, Job, Faculty])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
