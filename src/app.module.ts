import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AlumniBatchesModule } from './alumni-batches/alumni-batches.module';
import { FormsModule } from './forms/forms.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ReportsModule } from './reports/reports.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { LegacyImportModule } from './legacy-import/legacy-import.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';
import { MailModule } from './mail/mail.module';
import { MailSettingsModule } from './mail-settings/mail-settings.module';
import { ServiceConfigModule } from './service-config/service-config.module';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    //rate limit
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 150,
      },
    ]),
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
        autoLoadEntities: true,
        // FIX: synchronize chỉ bật khi DB_SYNC=true (local dev).
        // Trên server PHẢI để tắt: nếu kiểu cột trong DB lệch với entity
        // (vd cột options là longtext do import dump, entity khai báo json),
        // TypeORM sync sẽ DROP cột + tạo lại mỗi lần khởi động
        // → mất sạch dữ liệu cột đó sau mỗi lần deploy/restart.
        synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
        logging: false,
        charset: 'utf8mb4_general_ci',
        // Tránh crash "connection in closed state" khi MySQL chưa sẵn sàng
        connectTimeout: 30000,
        acquireTimeout: 30000,
        extra: {
          connectionLimit: 10,
          connectTimeout: 30000,
          acquireTimeout: 30000,
        },
        retryAttempts: 5,
        retryDelay: 3000,
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
    AlumniBatchesModule,
    FormsModule,
    StatisticsModule,
    ReportsModule,
    ExternalApiModule,
    LegacyImportModule,
    JobApplicationsModule,
    MailModule,
    MailSettingsModule,
    ServiceConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}