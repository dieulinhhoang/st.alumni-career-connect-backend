export class CreateFormQuestionDto {
  formId: number;
  questionText: string;
  questionType: string;
  order?: number;
  required?: boolean;
  options?: string[];
  sectionId?: number;
}
