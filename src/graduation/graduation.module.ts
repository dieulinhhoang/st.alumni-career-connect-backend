import { Module } from '@nestjs/common';
import { GraduationService } from './graduation.service';
import { GraduationController } from './graduation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Graduation } from 'src/database/entities/graduation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Graduation])],
  controllers: [GraduationController],
  providers: [GraduationService],
})
export class GraduationModule {}
