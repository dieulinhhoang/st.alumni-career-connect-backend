import { Injectable } from '@nestjs/common';

@Injectable()
export class FormsService {
  private forms = [
    { id: 1, name: 'Khảo sát việc làm sau tốt nghiệp' },
    { id: 2, name: 'Đánh giá năng lực sinh viên' },
    { id: 3, name: 'Feedback từ doanh nghiệp' },
  ];

  private questions = [
    { id: 'q1', title: 'Trạng thái việc làm sau tốt nghiệp', chartType: 'pie' },
    { id: 'q2', title: 'Mức lương cá nhân', chartType: 'bar' },
    { id: 'q3', title: 'Lĩnh vực công tác hiện tại', chartType: 'column' },
    { id: 'q4', title: 'Nhu cầu đào tạo thêm', chartType: 'bar' },
    { id: 'q5', title: 'Mức độ hài lòng với chương trình đào tạo', chartType: 'line' },
  ];

  private nextId = 4;

  findAll() {
    return this.forms;
  }

  findOne(id: number) {
    return this.forms.find((f) => f.id === id) ?? null;
  }

  create(body: any) {
    const form = { id: this.nextId++, ...body };
    this.forms.push(form);
    return form;
  }

  update(id: number, body: any) {
    const idx = this.forms.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    this.forms[idx] = { ...this.forms[idx], ...body };
    return this.forms[idx];
  }

  remove(id: number) {
    const idx = this.forms.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    const removed = this.forms.splice(idx, 1);
    return removed[0];
  }

  getQuestions() {
    return this.questions;
  }
}
