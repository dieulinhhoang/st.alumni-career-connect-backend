import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormPayloadDto } from './dto/form.dto';

const payload: FormPayloadDto = {
  name: 'Form A',
  description: 'desc',
  sections: [{ id: 's1', title: 'Section 1', order: 0 }],
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'Q?',
      required: true,
      options: [],
      sectionId: 's1',
      order: 0,
    },
  ],
};

describe('FormsController', () => {
  let controller: FormsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [FormsService],
    }).compile();
    controller = module.get<FormsController>(FormsController);
  });

  it('creates and retrieves a form', () => {
    const created = controller.create(payload);
    expect(created.id).toBeDefined();
    expect(controller.findOne(created.id).name).toBe('Form A');
    expect(controller.findAll()).toHaveLength(1);
  });

  it('replaces a form via PUT', () => {
    const created = controller.create(payload);
    const replaced = controller.replace(created.id, { ...payload, name: 'B' });
    expect(replaced.name).toBe('B');
  });

  it('patches a form via PATCH', () => {
    const created = controller.create(payload);
    const patched = controller.update(created.id, { description: 'new' });
    expect(patched.description).toBe('new');
    expect(patched.name).toBe('Form A');
  });

  it('deletes a form', () => {
    const created = controller.create(payload);
    controller.remove(created.id);
    expect(controller.findAll()).toHaveLength(0);
  });
});
