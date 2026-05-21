import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';

// Entities
import { Enterprise } from '../entities/enterprise.entity';
import { EnterpriseFaculty } from '../entities/enterprise-faculty.entity';
import { Faculty } from '../entities/faculty.entity';
import { Graduation } from '../entities/graduation.entity';
import { GraduationStudent } from '../entities/graduation-student.entity';
import { GroupPermission } from '../entities/group-permission.entity';
import { Job } from '../entities/job.entity';
import { JobFaculty } from '../entities/job-faculty.entity';
import { Major } from '../entities/major.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { StatIndicatorConfig } from '../entities/stat-indicator-config.entity';
import { Student } from '../entities/student.entity';
import { Survey } from '../entities/survey.entity';
import { SurveyAiGeneration } from '../entities/survey-ai-generation.entity';
import { SurveyAnswer } from '../entities/survey-answer.entity';
import { SurveyGraduation } from '../entities/survey-graduation.entity';
import { SurveyQuestion } from '../entities/survey-question.entity';
import { SurveyResponse } from '../entities/survey-response.entity';
import { SurveySection } from '../entities/survey-section.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Enterprise
      Enterprise,
      EnterpriseFaculty,

      // Faculty & Academic
      Faculty,
      Major,
      Student,

      // Graduation
      Graduation,
      GraduationStudent,

      // Job
      Job,
      JobFaculty,

      // Auth & Access Control
      User,
      Role,
      UserRole,
      Permission,
      RolePermission,
      GroupPermission,

      // Survey
      Survey,
      SurveySection,
      SurveyQuestion,
      SurveyAnswer,
      SurveyResponse,
      SurveyGraduation,
      SurveyAiGeneration,

      // Stats
      StatIndicatorConfig,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})

export class SeedModule implements OnApplicationBootstrap {
  constructor(private readonly seedService: SeedService) {}

  async onApplicationBootstrap() {
    await this.seedService.run();
  }
}