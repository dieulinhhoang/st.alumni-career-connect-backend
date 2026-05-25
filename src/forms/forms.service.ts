import { Injectable, NotFoundException } from '@nestjs/common';

// In-memory stores (replace with TypeORM entities for production)
const formsStore: any[] = [];
let formIdCounter = 1;
const questionsStore: any[] = [];
let questionIdCounter = 1;

const THEMES = [
  { id: 1, name: 'Mặc định', primaryColor: '#1677ff', backgroundColor: '#ffffff' },
  { id: 2, name: 'Tối', primaryColor: '#001529', backgroundColor: '#141414' },
  { id: 3, name: 'Xanh lá', primaryColor: '#52c41a', backgroundColor: '#f6ffed' },
  { id: 4, name: 'Đỏ', primaryColor: '#ff4d4f', backgroundColor: '#fff1f0' },
];

const FONTS = [
  { id: 1, name: 'Inter', value: 'Inter, sans-serif' },
  { id: 2, name: 'Roboto', value: 'Roboto, sans-serif' },
  { id: 3, name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { id: 4, name: 'Montserrat', value: 'Montserrat, sans-serif' },
];

const RADIUS_OPTIONS = [
  { id: 1, name: 'Vuông', value: '0px' },
  { id: 2, name: 'Bo nhẹ', value: '4px' },
  { id: 3, name: 'Bo vừa', value: '8px' },
  { id: 4, name: 'Bo nhiều', value: '16px' },
];

const QUESTION_TYPE_OPTIONS = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'radio', label: 'Chọn một' },
  { value: 'checkbox', label: 'Chọn nhiều' },
  { value: 'select', label: 'Dropdown' },
  { value: 'rating', label: 'Đánh giá sao' },
  { value: 'date', label: 'Ngày tháng' },
  { value: 'file', label: 'Tải tệp' },
];

@Injectable()
export class FormsService {
  getThemes() { return { items: THEMES, total: THEMES.length }; }
  getFonts() { return { items: FONTS, total: FONTS.length }; }
  getRadiusOptions() { return { items: RADIUS_OPTIONS, total: RADIUS_OPTIONS.length }; }
  getQuestionTypeOptions() { return { items: QUESTION_TYPE_OPTIONS, total: QUESTION_TYPE_OPTIONS.length }; }

  findAllForms(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const items = formsStore.slice(page * size, page * size + size);
    return { items, page, size, total: formsStore.length, totalPages: Math.ceil(formsStore.length / size) };
  }

  createForm(dto: any) {
    const form = { id: formIdCounter++, ...dto, createdAt: new Date().toISOString(), status: dto.status ?? 'draft' };
    formsStore.push(form);
    return form;
  }

  findOneForm(id: number) {
    const form = formsStore.find((f) => f.id === id);
    if (!form) throw new NotFoundException('Không tìm thấy form');
    const questions = questionsStore.filter((q) => q.formId === id);
    return { ...form, questions };
  }

  updateForm(id: number, dto: any) {
    const index = formsStore.findIndex((f) => f.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy form');
    formsStore[index] = { ...formsStore[index], ...dto, updatedAt: new Date().toISOString() };
    return formsStore[index];
  }

  removeForm(id: number) {
    const index = formsStore.findIndex((f) => f.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy form');
    formsStore.splice(index, 1);
    return { message: 'Xóa form thành công' };
  }

  findAllQuestions(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const formId = query.formId ? Number(query.formId) : undefined;
    let items = formId ? questionsStore.filter((q) => q.formId === formId) : [...questionsStore];
    const total = items.length;
    items = items.slice(page * size, page * size + size);
    return { items, page, size, total, totalPages: Math.ceil(total / size) };
  }

  createQuestion(dto: any) {
    const question = { id: questionIdCounter++, ...dto, createdAt: new Date().toISOString() };
    questionsStore.push(question);
    return question;
  }

  findOneQuestion(id: number) {
    const q = questionsStore.find((q) => q.id === id);
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi');
    return q;
  }

  updateQuestion(id: number, dto: any) {
    const index = questionsStore.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy câu hỏi');
    questionsStore[index] = { ...questionsStore[index], ...dto };
    return questionsStore[index];
  }

  removeQuestion(id: number) {
    const index = questionsStore.findIndex((q) => q.id === id);
    if (index === -1) throw new NotFoundException('Không tìm thấy câu hỏi');
    questionsStore.splice(index, 1);
    return { message: 'Xóa câu hỏi thành công' };
  }
}
