import { Module } from '@nestjs/common';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { AlumniProfile } from '../database/entities/alumni-profile.entity';
import { Student } from '../database/entities/student.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlumniProfile, Student]),
  ],
  controllers: [ExternalApiController],
  providers: [ExternalApiService]
})
export class ExternalApiModule {}
