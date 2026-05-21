import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt'; 
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../database/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), 
    HttpModule,
    
    // Đăng ký JwtModule để cung cấp JwtService cho AuthController / AuthService
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY_MAC_DINH', // 
      signOptions: { expiresIn: '1d' }, // Token có hạn trong 1 ngày  
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}