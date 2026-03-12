import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Major } from '../major.entity';
import { User } from '../user.entity';
import { Role } from '../role.entity';
import { Permission } from '../permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Major, User, Role, Permission]),
  ],
  providers: [SeedService],
})
export class SeedModule {}