import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Student } from 'src/database/entities/student.entity';
import { Enterprise } from 'src/database/entities/enterprise.entity';
import { Job } from 'src/database/entities/job.entity';
import { Graduation } from 'src/database/entities/graduation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Enterprise, Job, Graduation]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
