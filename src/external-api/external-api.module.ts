import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { AlumniProfile } from '../database/entities/alumni-profile.entity';
import { ApiKey } from '../database/entities/api-key.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlumniProfile, ApiKey]),
  ],
  controllers: [ExternalApiController],
  providers: [ExternalApiService],
})
export class ExternalApiModule {}
