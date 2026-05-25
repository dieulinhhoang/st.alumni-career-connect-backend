import { Injectable } from '@nestjs/common';

@Injectable()
export class SurveyBatchesService {
  private batches: any[] = [
    {
      id: 1,
      title: 'Đợt khảo sát tháng 6/2024',
      description: 'Khảo sát việc làm sinh viên tốt nghiệp 2024',
      formId: 1,
      formSnapshot: null,
      status: 'completed',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      year: 2024,
      graduationPeriod: '2024',
      totalStudents: 512,
      responses: [],
      createdAt: '2024-05-15T00:00:00',
      updatedAt: '2024-07-01T00:00:00',
    },
    {
      id: 2,
      title: 'Đợt khảo sát tháng 12/2024',
      description: 'Khảo sát việc làm sinh viên tốt nghiệp T12/2024',
      formId: 1,
      formSnapshot: null,
      status: 'active',
      startDate: '2024-12-01',
      endDate: '2024-12-31',
      year: 2024,
      graduationPeriod: '2024-2',
      totalStudents: 248,
      responses: [],
      createdAt: '2024-11-20T00:00:00',
      updatedAt: '2024-12-15T00:00:00',
    },
  ];

  private nextId = 3;

  findAll() {
    return this.batches;
  }

  findOne(id: number) {
    return this.batches.find((b) => b.id === id) ?? null;
  }

  create(body: any) {
    const batch = { id: this.nextId++, responses: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    this.batches.push(batch);
    return batch;
  }

  update(id: number, body: any) {
    const idx = this.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    this.batches[idx] = { ...this.batches[idx], ...body, updatedAt: new Date().toISOString() };
    return this.batches[idx];
  }

  remove(id: number) {
    const idx = this.batches.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    return this.batches.splice(idx, 1)[0];
  }
}
