export class OptionDto {
  id: string;
  label: string;
}

export class SectionDto {
  id: string;
  title: string;
  order: number;
}

export class QuestionDto {
  id: string;
  type: string;
  title: string;
  required: boolean;
  options: OptionDto[];
  sectionId: string;
  order: number;
}

export class FormPayloadDto {
  name: string;
  description: string;
  questions: QuestionDto[];
  sections: SectionDto[];
}

export class Form extends FormPayloadDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}
