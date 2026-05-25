import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniBatch } from '../database/entities/alumni-batch.entity';
import { Survey } from '../database/entities/survey.entity';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(AlumniBatch)
    private readonly batchRepo: Repository<AlumniBatch>,

    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
  ) {}

  // ─── Batches ────────────────────────────────────────────────────────────────

  async getBatches(): Promise<AlumniBatch[]> {
    return this.batchRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getBatchById(id: number): Promise<AlumniBatch> {
    const batch = await this.batchRepo.findOne({ where: { id } });
    if (!batch) throw new NotFoundException(`Batch #${id} not found`);
    return batch;
  }

  async createBatch(dto: CreateBatchDto): Promise<AlumniBatch> {
    // Validate form exists
    const form = await this.surveyRepo.findOne({ where: { id: dto.formId } });
    if (!form) throw new NotFoundException(`Form #${dto.formId} not found`);

    // Build form snapshot — store the minimal shape FE needs
    const formSnapshot = dto.formSnapshot ?? {
      id: form.id,
      title: form.title,
      description: form.description,
      surveyType: form.surveyType,
      settings: form.settings,
      themeConfig: form.themeConfig,
    };

    const batch = this.batchRepo.create({
      title: dto.title,
      description: dto.description,
      formId: dto.formId,
      formSnapshot,
      status: 'draft',
      startDate: dto.startDate,
      endDate: dto.endDate,
      year: dto.year,
      graduationPeriod: dto.graduationPeriod,
      totalStudents: dto.totalStudents ?? 0,
      responses: [],
    });

    return this.batchRepo.save(batch);
  }

  async updateBatch(id: number, dto: UpdateBatchDto): Promise<AlumniBatch> {
    const batch = await this.getBatchById(id);
    Object.assign(batch, dto);
    return this.batchRepo.save(batch);
  }

  async deleteBatch(id: number): Promise<{ message: string }> {
    const batch = await this.getBatchById(id);
    await this.batchRepo.softRemove(batch);
    return { message: `Batch #${id} deleted` };
  }

  async getBatchStats(id: number): Promise<{
    total: number;
    submitted: number;
    rate: number;
    employmentRate?: number;
    suitableRate?: number;
  }> {
    const batch = await this.getBatchById(id);
    const responses = batch.responses ?? [];
    const total = batch.totalStudents || 0;
    const submitted = responses.filter(
      (r: any) => r.status === 'submitted',
    ).length;
    const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    // Calculate employment & suitable rates from answers if present
    let employedCount = 0;
    let suitableCount = 0;
    const submittedResponses = responses.filter(
      (r: any) => r.status === 'submitted',
    );

    submittedResponses.forEach((r: any) => {
      const answers = r.answers ?? {};
      if (answers['employed'] === true || answers['employment_status'] === 'employed') {
        employedCount++;
      }
      if (answers['job_suitable'] === true || answers['suitable'] === true) {
        suitableCount++;
      }
    });

    const employmentRate =
      submitted > 0 ? Math.round((employedCount / submitted) * 100) : 0;
    const suitableRate =
      submitted > 0 ? Math.round((suitableCount / submitted) * 100) : 0;

    return { total, submitted, rate, employmentRate, suitableRate };
  }
}
