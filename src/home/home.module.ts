import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Student } from '../students/entities/student.entity';
import { Enterprise } from '../enterprises/entities/enterprise.entity';
import { Job } from '../jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Enterprise, Job])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
