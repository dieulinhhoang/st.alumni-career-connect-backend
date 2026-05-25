import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { SurveysModule } from './surveys/surveys.module';
import { StudentsModule } from './students/students.module';
import { SeedModule } from './database/seed/seed.module';
import { UsersModule } from './users/users.module';
import { RoleModule } from './role/role.module';
import { ResourcesModule } from './resources/resources.module';
import { FacultyModule } from './faculty/faculty.module';
import { EnterprisesModule } from './enterprises/enterprises.module';
import { JobsModule } from './jobs/jobs.module';
import { GraduationModule } from './graduation/graduation.module';
import { MajorModule } from './major/major.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AlumniModule } from './alumni/alumni.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
        chartset: 'utf8mb4_general_ci',
      }),
    }),
    SeedModule,
    AuthModule,
    SurveysModule,
    StudentsModule,
    UsersModule,
    RoleModule,
    ResourcesModule,
    FacultyModule,
    EnterprisesModule,
    JobsModule,
    GraduationModule,
    MajorModule,
    DashboardModule,
    AlumniModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
