import { Module } from '@nestjs/common';
import { MajorService } from './major.service';
import { MajorController } from './major.controller';
import { Major } from 'src/database/entities/major.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Major])],
  controllers: [MajorController],
  providers: [MajorService],
})
export class MajorModule {}
