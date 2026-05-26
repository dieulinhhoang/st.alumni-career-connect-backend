import { PartialType } from '@nestjs/mapped-types';
import { CreateBatchDto } from './create-batch.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdateBatchDto extends PartialType(CreateBatchDto) {
  @IsOptional()
  @IsIn(['draft', 'active', 'ended'])
  status?: 'draft' | 'active' | 'ended';
}
