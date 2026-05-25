import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnterprisesController } from './enterprises.controller';
import { EnterprisesService } from './enterprises.service';
import { Enterprise } from 'src/database/entities/enterprise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enterprise])],
  controllers: [EnterprisesController],
  providers: [EnterprisesService],
  exports: [EnterprisesService],
})
export class EnterprisesModule {}
