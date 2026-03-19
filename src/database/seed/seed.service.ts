import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Survey } from '../survey.entity';
import { SurveyQuestion } from '../survey-question.entity';
import { SurveyResponse } from '../survey-response.entity';
import { SurveyAnswer } from '../survey-answer.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion) private questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyResponse) private responseRepo: Repository<SurveyResponse>,
    @InjectRepository(SurveyAnswer) private answerRepo: Repository<SurveyAnswer>,
  ) {}

  async onModuleInit() {
    this.logger.log('Kich hoat Seed du lieu...');
    await this.refreshAndSeed();
  }

  async refreshAndSeed() {
    // Dung queryRunner de clear du lieu tranh loi Empty criteria
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Xoa du lieu theo thu tu de tranh loi Foreign Key
    await queryRunner.query('DELETE FROM survey_answers');
    await queryRunner.query('DELETE FROM survey_responses');
    await queryRunner.query('DELETE FROM survey_questions');
    await queryRunner.query('DELETE FROM surveys');
    
    await queryRunner.release();

    this.logger.log('Da lam sach database. Bat dau nap moi...');

    const survey = await this.surveyRepo.save({
      title: 'Khao sat tinh hinh viec lam cua sinh vien tot nghiep nam 2024',
      description: 'Voi muc tieu dao tao sinh vien tot nghiep ra truong co viec lam phu hop',
      survey_type: 'employment',
      status: 'published',
    });

    await this.questionRepo.save([
      { survey_id: survey.id, question_key: 'full_name', question_text: 'Ho va ten', question_type: 'text', order_index: 1 },
      { survey_id: survey.id, question_key: 'student_code', question_text: 'Ma sinh vien', question_type: 'text', order_index: 2 },
      { survey_id: survey.id, question_key: 'employment_status', question_text: 'Tinh trang viec lam', question_type: 'radio', order_index: 3 },
      { survey_id: survey.id, question_key: 'recruit_partner_name', question_text: 'Ten don vi tuyen dung', question_type: 'text', order_index: 4 }
    ]);

     const resSang = await this.responseRepo.save({
      survey_id: survey.id,
      student_code: '655185',
      status: 'submitted',
      submitted_at: new Date('2026-03-02'),
    });

    await this.answerRepo.save([
      { response_id: resSang.id, question_key: 'full_name', answer_value: 'Ngo Xuan Sang' },
      { response_id: resSang.id, question_key: 'student_code', answer_value: '655185' },
      { response_id: resSang.id, question_key: 'employment_status', answer_value: 'Da co viec lam' },
      { response_id: resSang.id, question_key: 'recruit_partner_name', answer_value: 'Luc luong vu trang nhan dan' },
    ]);

    // Nap them du lieu ao
    const statuses = ['Da co viec lam', 'Chua co viec lam', 'Dang tiep tuc hoc'];
    for (let i = 1; i <= 10; i++) {
      const resDummy = await this.responseRepo.save({
        survey_id: survey.id,
        student_code: `SV_AO_${i}`,
        status: 'submitted',
        submitted_at: new Date(),
      });

      await this.answerRepo.save([
        { response_id: resDummy.id, question_key: 'full_name', answer_value: `Sinh vien ao ${i}` },
        { response_id: resDummy.id, question_key: 'employment_status', answer_value: statuses[i % 3] },
      ]);
    }

    this.logger.log('DA NAP XONG 11 BAN GHI');
  }
}