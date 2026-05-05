import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormPayloadDto } from './dto/form.dto';

const samplePayload = (): FormPayloadDto => ({
  name: 'Mentorship Application',
  description: 'Onboarding form for new mentors',
  sections: [
    { id: 'sec-1', title: 'About you', order: 0 },
    { id: 'sec-2', title: 'Experience', order: 1 },
  ],
  questions: [
    {
      id: 'q-1',
      type: 'short_text',
      title: 'Full name',
      required: true,
      options: [],
      sectionId: 'sec-1',
      order: 0,
    },
    {
      id: 'q-2',
      type: 'single_choice',
      title: 'Industry',
      required: false,
      options: [
        { id: 'opt-1', label: 'Tech' },
        { id: 'opt-2', label: 'Finance' },
      ],
      sectionId: 'sec-2',
      order: 0,
    },
  ],
});

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsService],
    }).compile();
    service = module.get<FormsService>(FormsService);
  });

  it('creates a form and preserves frontend ids', () => {
    const form = service.create(samplePayload());
    expect(form.id).toBeDefined();
    expect(form.name).toBe('Mentorship Application');
    expect(form.sections[0].id).toBe('sec-1');
    expect(form.questions[1].options[0].id).toBe('opt-1');
    expect(form.createdAt).toBeDefined();
    expect(form.updatedAt).toBeDefined();
  });

  it('lists all forms', () => {
    service.create(samplePayload());
    service.create({ ...samplePayload(), name: 'Second' });
    expect(service.findAll()).toHaveLength(2);
  });

  it('finds one form by id', () => {
    const created = service.create(samplePayload());
    expect(service.findOne(created.id).id).toBe(created.id);
  });

  it('throws NotFoundException for missing form', () => {
    expect(() => service.findOne('missing')).toThrow(NotFoundException);
  });

  it('replaces a form via PUT', () => {
    const created = service.create(samplePayload());
    const replaced = service.replace(created.id, {
      ...samplePayload(),
      name: 'Replaced',
    });
    expect(replaced.id).toBe(created.id);
    expect(replaced.name).toBe('Replaced');
    expect(replaced.createdAt).toBe(created.createdAt);
  });

  it('patches a form partially', () => {
    const created = service.create(samplePayload());
    const patched = service.update(created.id, { name: 'Patched' });
    expect(patched.name).toBe('Patched');
    expect(patched.questions).toHaveLength(2);
  });

  it('removes a form', () => {
    const created = service.create(samplePayload());
    service.remove(created.id);
    expect(() => service.findOne(created.id)).toThrow(NotFoundException);
  });

  it('rejects invalid payloads', () => {
    expect(() =>
      service.create({
        name: 123 as unknown as string,
        description: '',
        sections: [],
        questions: [],
      }),
    ).toThrow(BadRequestException);
  });
});
