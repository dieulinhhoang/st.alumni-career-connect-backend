/**
 * Dữ liệu mẫu cho survey mặc định của hệ thống ("form 103"), dùng bởi
 * SeedService.seedDefaultEmploymentSurvey(). Toàn bộ question_key ở đây
 * PHẢI khớp với ANSWER_KEYS trong legacy-report.constants.ts (kể cả
 * `4dyqef` = hiringDate) để legacy-import luôn decode đúng, bất kể
 * survey.id khác nhau giữa các môi trường (local/server).
 */

export const DEFAULT_EMPLOYMENT_SURVEY_TITLE =
  'Khảo sát tình hình việc làm của sinh viên tốt nghiệp';

export const DEFAULT_EMPLOYMENT_SURVEY_DESCRIPTION =
  'Thân gửi Anh/Chị cựu sinh viên của Học viện Nông Nghiệp Việt Nam! ' +
  'Với mục tiêu đào tạo sinh viên tốt nghiệp ra trường có việc làm phù hợp với ngành đào tạo và đáp ứng nhu cầu của thị trường lao động, ' +
  'Học viện Nông nghiệp Việt Nam tổ chức khảo sát tình hình việc làm của sinh viên tốt nghiệp. ' +
  'Học viện trân trọng đề nghị các Anh/Chị vui lòng cung cấp thông tin theo các nội dung dưới đây bằng cách lựa chọn hoặc điền thông tin trả lời cho từng câu hỏi. ' +
  'Chúng tôi cam kết các thông tin cá nhân được cung cấp trong phiếu khảo sát sẽ được hoàn toàn bảo mật. Trân trọng cảm ơn sự cộng tác của các Anh/Chị!';

export const DEFAULT_EMPLOYMENT_SURVEY_THEME_CONFIG = {
  themeId: '',
  header: {
    ministry: 'Bộ Nông nghiệp và Môi trường',
    academy: 'Học viện Nông nghiệp Việt Nam',
    address: 'Xã Gia Lâm, Thành phố Hà Nội',
    phone: '024.62617586',
    showDate: true,
  },
  footer: {
    primaryText: 'Xin trân trọng cảm ơn sự hợp tác của Anh/Chị!',
    secondaryText: 'Kính chúc Anh/Chị sức khỏe và thành công!',
  },
};

export const DEFAULT_EMPLOYMENT_SURVEY_SECTIONS = [
  { id: 'mt7xev', order: 0, title: 'Phần I. Thông tin cá nhân' },
  { id: 'ntlswc', order: 1, title: 'Phần II: Nội dung khảo sát' },
];

export interface DefaultSurveyQuestionSeed {
  questionKey: string;
  questionText: string;
  questionType: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select' | 'date' | 'number' | 'rating' | 'upload';
  options: { id: string; label: string }[];
  isRequired: number;
  sectionKey: string;
  orderIndex: number;
  reportFieldKey: string | null;
  showInChart: number;
  chartType: 'pie' | 'column' | null;
  reportTemplate: string | null;
  excelColumn: string | null;
}

/** 27 câu hỏi đúng theo "form 103" — question_key phải khớp ANSWER_KEYS */
export const DEFAULT_EMPLOYMENT_SURVEY_QUESTIONS: DefaultSurveyQuestionSeed[] = [
  { questionKey: '80ysrp', questionText: 'Mã sinh viên', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 0, reportFieldKey: 'student_code', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: null },
  { questionKey: 'g183rm', questionText: 'Họ và tên', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 1, reportFieldKey: 'fullname', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'fullName' },
  { questionKey: 'hn98q4', questionText: 'Giới tính', questionType: 'radio', options: [{ id: 'cdoc70', label: 'Nam' }, { id: 'yd1l93', label: 'Nữ' }], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 2, reportFieldKey: 'gender', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'gender' },
  { questionKey: 'htcuki', questionText: 'Ngày sinh', questionType: 'date', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 3, reportFieldKey: 'dob', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'dob' },
  { questionKey: 'lbxfns', questionText: 'Mã ngành đào tạo', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 4, reportFieldKey: 'industrycode', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'majorCode' },
  { questionKey: 'ees6gh', questionText: 'Số CCCD', questionType: 'text', options: [], isRequired: 0, sectionKey: 'mt7xev', orderIndex: 5, reportFieldKey: 'citizen_identification', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'cccd' },
  { questionKey: 'il1ap2', questionText: 'Khóa học', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 6, reportFieldKey: 'courseyear', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: null },
  { questionKey: 'ni0dcj', questionText: 'Tên ngành được đào tạo', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 7, reportFieldKey: 'industryname', showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'majorName' },
  { questionKey: 'pe90b3', questionText: ' Số điện thoại', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 8, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'phone' },
  { questionKey: 'vctubh', questionText: 'Email', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 9, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'email' },
  { questionKey: 'x0ya9z', questionText: ' Anh/Chị vui lòng cho biết tình trạng việc làm hiện tại của Anh/Chị', questionType: 'radio', options: [{ id: '13b64529-ec9e-40d9-bd75-910bcd2ddc1f', label: 'Đã có việc làm' }, { id: 'vsd4us', label: 'Đang tiếp tục học' }, { id: 'nbzxu9', label: 'Chưa có việc làm' }, { id: 'rvy5xf', label: 'Chưa đi tìm việc' }], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 10, reportFieldKey: 'rk_x0ya9z', showInChart: 1, chartType: 'column', reportTemplate: 'mau03', excelColumn: 'employmentStatus' },
  { questionKey: 'mpju4t', questionText: 'Tên đơn vị tuyển dụng', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 11, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: null },
  { questionKey: '9a814s', questionText: 'Địa chỉ đơn vị', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 12, reportFieldKey: 'rk_9a814s', showInChart: 0, chartType: null, reportTemplate: 'mau01', excelColumn: 'workLocation' },
  { questionKey: '4dyqef', questionText: 'Thời gian tuyển dụng', questionType: 'date', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 13, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'hiringDate' },
  { questionKey: 'rao44c', questionText: ' Chức vụ, vị trí việc làm', questionType: 'text', options: [], isRequired: 1, sectionKey: 'mt7xev', orderIndex: 14, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: null },
  { questionKey: 'cqgeu7', questionText: 'Đơn vị Anh/Chị đang làm việc thuộc khu vực làm việc nào?', questionType: 'radio', options: [{ id: '1eba9ad8-a142-4ad2-a433-141bb9f62902', label: 'Khu vực Nhà nước' }, { id: '6kly2j', label: 'Khu vực tư nhân' }, { id: 'pc7352', label: 'Khu vực có yếu tố nước ngoài' }, { id: 'wjlequ', label: 'Tự tạo việc làm' }], isRequired: 1, sectionKey: 'ntlswc', orderIndex: 20, reportFieldKey: 'rk_cqgeu7', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'workSector' },
  { questionKey: 'mn28jt', questionText: 'Sau khi tốt nghiệp, Anh/Chị có việc làm từ khi nào?', questionType: 'radio', options: [{ id: '1eec6e14-c65d-4e99-b7bf-ae964dc933e4', label: 'Dưới 3 tháng' }, { id: '7sn7l9', label: 'Từ 3 tháng đến dưới 6 tháng' }, { id: '8v0h5n', label: 'Từ 6 tháng đến dưới 12 tháng' }, { id: '2r58pt', label: 'Từ 12 tháng trở lên' }], isRequired: 1, sectionKey: 'ntlswc', orderIndex: 21, reportFieldKey: 'rk_mn28jt', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'jobSearchDuration' },
  { questionKey: 'vwje9g', questionText: 'Công việc Anh/Chị đang đảm nhận có phù hợp với ngành đào tạo không?', questionType: 'radio', options: [{ id: '9585904e-e37f-448c-9506-e4e18e41bf04', label: 'Đúng ngành đào tạo' }, { id: 'y7c5y2', label: 'Liên quan đến ngành đào tạo' }, { id: 'u1nhzm', label: 'Không liên quan đến ngành đào tạo' }], isRequired: 1, sectionKey: 'ntlswc', orderIndex: 22, reportFieldKey: 'rk_vwje9g', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'jobRelevance' },
  { questionKey: 'lelshm', questionText: 'Công việc Anh/Chị đang đảm nhận có phù hợp với trình độ chuyên môn không?', questionType: 'radio', options: [{ id: 'f5d960fb-1f16-4696-86a2-dfd0916d5199', label: 'Chưa phù hợp với trình độ chuyên môn' }, { id: 'udlcxf', label: 'Phù hợp với trình độ chuyên môn' }], isRequired: 1, sectionKey: 'ntlswc', orderIndex: 23, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: null },
  { questionKey: 'b8mjm9', questionText: 'Anh/chị có học được các kiến thức và kỹ năng cần thiết từ nhà trường cho công việc theo ngành tốt nghiệp không?', questionType: 'radio', options: [{ id: '7ae56005-59d4-425e-bf9e-77dd90da1e33', label: 'Đã học được' }, { id: 'vrmjen', label: 'Không học được' }, { id: 'h8ewc6', label: 'Chỉ học được một phần' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 24, reportFieldKey: 'rk_b8mjm9', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'trainingFit' },
  { questionKey: 'tmzijc', questionText: 'Mức lương khởi điểm của Anh/Chị (triệu đồng/tháng)', questionType: 'text', options: [], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 25, reportFieldKey: null, showInChart: 0, chartType: null, reportTemplate: null, excelColumn: 'salary' },
  { questionKey: 'g130px', questionText: 'Mức thu nhập bình quân/tháng tính theo VNĐ của Anh/Chị hiện nay', questionType: 'radio', options: [{ id: 'c7dd0749-46d2-45cf-bcf5-7c6dd88cfdfe', label: 'Dưới 5 triệu' }, { id: '3asyrd', label: 'Từ 5 triệu đến dưới 10 triệu' }, { id: 'hqat18', label: 'Từ 10 triệu đến dưới 15 triệu' }, { id: 'oiwr9x', label: 'Từ 15 triệu trở lên' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 26, reportFieldKey: 'rk_g130px', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'avgIncome' },
  { questionKey: '196kig', questionText: 'Anh/Chị tìm được việc làm thông qua những hình thức nào?', questionType: 'checkbox', options: [{ id: 'efedb84b-ec42-4e33-942a-692581a6f479', label: 'Do Học viện/Khoa giới thiệu' }, { id: '9emyga', label: 'Bạn bè, người quen giới thiệu' }, { id: 't92o47', label: 'Tự tìm việc làm' }, { id: 'lwge5t', label: 'Tự tạo việc làm' }, { id: 'd90veu', label: 'Hình thức khác' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 27, reportFieldKey: 'rk_196kig', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'searchMethod' },
  { questionKey: 'tpgdsl', questionText: 'Anh/chị được tuyển dụng theo hình thức nào?', questionType: 'radio', options: [{ id: '2a9ede1e-4d21-4d2f-8941-d21016ff2fa3', label: 'Thi tuyển' }, { id: 'o793xw', label: 'Xét tuyển' }, { id: 'y9fj1x', label: 'Hợp đồng' }, { id: 'iq2eao', label: 'Biệt phái' }, { id: 'w2xa4o', label: 'Điều động' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 28, reportFieldKey: 'rk_tpgdsl', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'hiringMethod' },
  { questionKey: 'p0nfcp', questionText: '25. Trong quá trình làm việc, Anh/Chị cần những kỹ năng mềm nào sau đây? (Có thể chọn nhiều lựa chọn)', questionType: 'checkbox', options: [{ id: '4062c13b-59c9-4e9d-aa5e-04b5cb57d5e8', label: 'Kỹ năng giao tiếp' }, { id: '1nk6bs', label: 'Kỹ năng lãnh đạo' }, { id: 'q03hqp', label: 'Kỹ năng thuyết trình' }, { id: '3fex9v', label: 'Kỹ năng tiếng Anh' }, { id: 'uykeg5', label: 'Kỹ năng làm việc nhóm' }, { id: '5nnejl', label: 'Kỹ năng tin học' }, { id: 'pt70mk', label: 'Kỹ năng viết báo cáo tài liệu' }, { id: 'b0gk0a', label: 'Kỹ năng hội nhập quốc tế' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 29, reportFieldKey: 'rk_p0nfcp', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'softSkills' },
  { questionKey: 'yypf89', questionText: 'Sau khi được tuyển dụng, Anh/Chị có phải tham gia khóa học nâng cao nào dưới đây để đáp ứng công việc không (Có thể chọn nhiều lựa chọn)', questionType: 'checkbox', options: [{ id: '76ee23d1-661c-4051-80a9-347660377302', label: 'Nâng cao kiến thức chuyên môn' }, { id: '60giwz', label: 'Nâng cao kỹ năng chuyên môn nghiệp vụ' }, { id: 'mq688l', label: 'Nâng cao về kỹ năng công nghệ thông tin' }, { id: '7vunxp', label: 'Nâng cao kỹ năng ngoại ngữ' }, { id: 'wqlkaz', label: 'Phát triển kỹ năng quản lý' }, { id: 's656rr', label: 'Tiếp tục học thạc sĩ, tiến sĩ' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 30, reportFieldKey: 'rk_yypf89', showInChart: 0, chartType: null, reportTemplate: 'mau03', excelColumn: 'postGradCourse' },
  { questionKey: 'mqbih3', questionText: 'Theo Anh/Chị, những giải pháp nào sau đây giúp tăng tỷ lệ có việc làm đúng ngành của sinh viên tốt nghiệp từ chương trình đào tạo mà Anh/Chị đã học? (Có thể chọn nhiều lựa chọn)', questionType: 'checkbox', options: [{ id: 'f90c64fc-0539-42dd-b25e-dbef53240a9c', label: 'Học viện tổ chức các buổi trao đổi, chia sẻ kinh nghiệm tìm kiếm việc làm giữa cựu sinh viên với sinh viên' }, { id: 'c0h6mn', label: 'Học viện tổ chức các buổi trao đổi giữa đơn vị sử dụng lao động với sinh viên' }, { id: '09amq2', label: 'Đơn vị sử dụng lao động tham gia vào quá trình đào tạo' }, { id: 'mo72tv', label: 'Chương trình đào tạo được điều chỉnh và cập nhật theo nhu cầu của thị trường lao động' }, { id: '9xv4ia', label: 'Tăng cường các hoạt động thực hành và chuyên môn tại cơ sở' }], isRequired: 0, sectionKey: 'ntlswc', orderIndex: 31, reportFieldKey: 'rk_mqbih3', showInChart: 1, chartType: 'pie', reportTemplate: 'mau03', excelColumn: 'giaiPhap' },
];
