import { Injectable } from '@nestjs/common';

@Injectable()
export class ClassesService {
  private classes: any[] = [
    { id: '1', name: 'KTPM66A', khoa: 2021, students: 42, advisor: 'TS. Nguyễn Văn A' },
    { id: '2', name: 'KTPM66B', khoa: 2021, students: 38, advisor: 'TS. Trần Thị B' },
    { id: '3', name: 'KTPM67A', khoa: 2022, students: 45, advisor: 'PGS. Lê Văn C' },
    { id: '4', name: 'KTPM67B', khoa: 2022, students: 40, advisor: 'TS. Phạm Thị D' },
    { id: '5', name: 'KTPM68A', khoa: 2023, students: 50, advisor: 'TS. Hoàng Văn E' },
    { id: '6', name: 'KTPM68B', khoa: 2023, students: 47, advisor: 'TS. Vũ Thị F' },
  ];

  private nextId = 7;

  findAll(query: any) {
    let result = [...this.classes];
    if (query?.khoa) {
      result = result.filter((c) => c.khoa === +query.khoa);
    }
    return result;
  }

  findOne(id: string) {
    return this.classes.find((c) => c.id === id) ?? null;
  }

  create(body: any) {
    const cls = { id: String(this.nextId++), ...body };
    this.classes.push(cls);
    return cls;
  }

  update(id: string, body: any) {
    const idx = this.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.classes[idx] = { ...this.classes[idx], ...body };
    return this.classes[idx];
  }

  remove(id: string) {
    const idx = this.classes.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    return this.classes.splice(idx, 1)[0];
  }
}
