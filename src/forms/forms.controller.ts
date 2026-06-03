/**
 * FormsController
 *
 * FIX: Controller này chỉ xử lý các route PHỤ trợ không trùng với SurveysController:
 *  - /form-questions    → lấy câu hỏi từ FormEntity (legacy)
 *  - /question-type-options, /themes, /fonts, /radius-options → metadata tĩnh
 *
 * Route /forms/** đã được SurveysController xử lý (dùng Survey entity + normalized relations).
 * FormsController KHÔNG được mount route /forms/** nữa để tránh conflict.
 */
import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // FIX: thêm guard

@Controller()
@UseGuards(JwtAuthGuard) // FIX: bảo vệ tất cả các route
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  /**
   * GET /form-questions?formId=1
   * Trả về câu hỏi từ legacy FormEntity (dùng cho thống kê cũ).
   * Câu hỏi mới nên lấy từ StatisticsController (/form-questions với form_id).
   */
  @Get('form-questions/legacy')
  getQuestions(@Query() query: any) {
    return this.formsService.getQuestions(query);
  }

  @Get('question-type-options')
  getQuestionTypeOptions() {
    return [
      { value: 'text',     label: 'Text' },
      { value: 'radio',    label: 'Radio' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'select',   label: 'Select' },
      { value: 'textarea', label: 'Textarea' },
      { value: 'date',     label: 'Date' },
      { value: 'rating',   label: 'Rating' },
    ];
  }

  @Get('themes')
  getThemes() {
    return [];
  }

  @Get('fonts')
  getFonts() {
    return [];
  }

  @Get('radius-options')
  getRadiusOptions() {
    return [];
  }
}
