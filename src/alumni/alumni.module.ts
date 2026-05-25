import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumniController } from './alumni.controller';
import { AlumniService } from './alumni.service';
import { AlumniProfile } from 'src/database/entities/alumni-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlumniProfile])],
  controllers: [AlumniController],
  providers: [AlumniService],
  exports: [AlumniService],
})
export class AlumniModule {}
