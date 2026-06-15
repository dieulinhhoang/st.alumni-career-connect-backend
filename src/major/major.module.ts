import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MajorService } from './major.service';
import { MajorController } from './major.controller';
import { MajorsController } from './majors.controller';
import { Major } from 'src/database/entities/major.entity';
import { Faculty } from 'src/database/entities/faculty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Major, Faculty])],
  controllers: [MajorController, MajorsController],
  providers: [MajorService],
  exports: [MajorService],
})
export class MajorModule {}
