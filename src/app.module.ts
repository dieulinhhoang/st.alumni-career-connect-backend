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
// New modules
import { HomeModule } from './home/home.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ReportsModule } from './reports/reports.module';
import { FormsModule } from './forms/forms.module';
import { SurveyBatchesModule } from './survey-batches/survey-batches.module';
import { ClassesModule } from './classes/classes.module';

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
        charset: 'utf8mb4_general_ci',
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
    // New modules
    HomeModule,
    StatisticsModule,
    ReportsModule,
    FormsModule,
    SurveyBatchesModule,
    ClassesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
