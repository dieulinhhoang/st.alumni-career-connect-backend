/**
 * Legend giải mã 64 cột "marked"/giá trị của sheet "Mẫu báo cáo 3" trong file Excel
 * "Báo cáo tổng hợp" của hệ thống cũ. Đây là legend đã hiệu chỉnh từ
 * ReportSheet2.php/ReportSheet3.php (KHÔNG dùng config.php cũ), đã verify khớp
 * 100% với sheet "Mẫu báo cáo 1" cho 2 đợt khảo sát đã import thủ công.
 */

// Cột 10-12 -> vwje9g (jobRelevance)
export const JOB_RELEVANCE_LABELS: Record<number, string> = {
  10: 'Đúng ngành đào tạo',
  11: 'Liên quan đến ngành đào tạo',
  12: 'Không liên quan đến ngành đào tạo',
};

// Cột 13-14 -> x0ya9z (employmentStatus); không có cột nào được đánh dấu => "Đã có việc làm"
export const EMPLOYMENT_STATUS_LABELS: Record<number, string> = {
  13: 'Đang tiếp tục học',
  14: 'Chưa có việc làm',
};
export const EMPLOYMENT_STATUS_DEFAULT = 'Đã có việc làm';

// Cột 15-18 -> cqgeu7 (workSector)
export const WORK_SECTOR_LABELS: Record<number, string> = {
  15: 'Khu vực Nhà nước',
  16: 'Khu vực tư nhân',
  17: 'Tự tạo việc làm',
  18: 'Khu vực có yếu tố nước ngoài',
};

// Cột 20-23 -> mn28jt (jobSearchDuration)
export const JOB_SEARCH_DURATION_LABELS: Record<number, string> = {
  20: 'Dưới 3 tháng',
  21: 'Từ 3 tháng đến dưới 6 tháng',
  22: 'Từ 6 tháng đến dưới 12 tháng',
  23: 'Từ 12 tháng trở lên',
};

// Cột 24-26 -> b8mjm9 (trainingFit)
export const TRAINING_FIT_LABELS: Record<number, string> = {
  24: 'Đã học được',
  25: 'Chỉ học được một phần',
  26: 'Không học được',
};

// Cột 28-31 -> g130px (avgIncome)
export const AVG_INCOME_LABELS: Record<number, string> = {
  28: 'Dưới 5 triệu',
  29: 'Từ 5 triệu đến dưới 10 triệu',
  30: 'Từ 10 triệu đến dưới 15 triệu',
  31: 'Từ 15 triệu trở lên',
};

// Cột 32-36 -> 196kig (searchMethod, checkbox). Cột 36 = "Hình thức khác".
export const SEARCH_METHOD_LABELS: Record<number, string> = {
  32: 'Do Học viện/Khoa giới thiệu',
  33: 'Bạn bè, người quen giới thiệu',
  34: 'Tự tìm việc làm',
  35: 'Tự tạo việc làm',
  36: 'Hình thức khác',
};

// Cột 37-41 -> tpgdsl (hiringMethod, radio - chỉ lấy lựa chọn đầu tiên khớp).
// Cột 42 ("khác") không tồn tại trong form mới nên bỏ qua.
export const HIRING_METHOD_LABELS: Record<number, string> = {
  37: 'Thi tuyển',
  38: 'Hợp đồng',
  39: 'Điều động',
  40: 'Xét tuyển',
  41: 'Biệt phái',
};

// Cột 43-50 -> p0nfcp (softSkills, checkbox). Cột 51 ("khác") bỏ qua.
export const SOFT_SKILL_LABELS: Record<number, string> = {
  43: 'Kỹ năng giao tiếp',
  44: 'Kỹ năng thuyết trình',
  45: 'Kỹ năng làm việc nhóm',
  46: 'Kỹ năng viết báo cáo tài liệu',
  47: 'Kỹ năng lãnh đạo',
  48: 'Kỹ năng tiếng Anh',
  49: 'Kỹ năng tin học',
  50: 'Kỹ năng hội nhập quốc tế',
};

// Cột 52-57 -> yypf89 (postGradCourse, checkbox). Luôn decode bất kể employmentStatus.
export const POST_GRAD_COURSE_LABELS: Record<number, string> = {
  52: 'Nâng cao kiến thức chuyên môn',
  53: 'Nâng cao kỹ năng chuyên môn nghiệp vụ',
  54: 'Nâng cao về kỹ năng công nghệ thông tin',
  55: 'Nâng cao kỹ năng ngoại ngữ',
  56: 'Phát triển kỹ năng quản lý',
  57: 'Tiếp tục học thạc sĩ, tiến sĩ',
};

// Cột 58-63 -> mqbih3 (giaiPhap, checkbox). Luôn decode bất kể employmentStatus. Cột 63 ("Khác") vẫn decode bình thường.
export const GIAI_PHAP_LABELS: Record<number, string> = {
  58: 'Học viện tổ chức các buổi trao đổi, chia sẻ kinh nghiệm tìm kiếm việc làm giữa cựu sinh viên với sinh viên',
  59: 'Học viện tổ chức các buổi trao đổi giữa đơn vị sử dụng lao động với sinh viên',
  60: 'Đơn vị sử dụng lao động tham gia vào quá trình đào tạo',
  61: 'Chương trình đào tạo được điều chỉnh và cập nhật theo nhu cầu của thị trường lao động',
  62: 'Tăng cường các hoạt động thực hành và chuyên môn tại cơ sở',
  63: 'Khác',

};

// Cột 64 -> 4dyqef (hiringDate, date "Thời gian tuyển dụng"). Chỉ decode khi employmentStatus === "Đã có việc làm".

/** Cột 15-51: chỉ decode khi employmentStatus === "Đã có việc làm" */
export const EMPLOYED_ONLY_RANGE: [number, number] = [15, 51];

/** Cột 52-63: luôn decode */
export const ALWAYS_DECODE_RANGE: [number, number] = [52, 63];

/** question id (form 103) cho từng field trong `answers` JSON */
export const ANSWER_KEYS = {
  studentCode: '80ysrp',
  fullName: 'g183rm',
  gender: 'hn98q4',
  dob: 'htcuki',
  cccd: 'ees6gh',
  majorCode: 'lbxfns',
  majorName: 'ni0dcj',
  phone: 'pe90b3',
  email: 'vctubh',
  workLocation: '9a814s',
  jobRelevance: 'vwje9g',
  employmentStatus: 'x0ya9z',
  workSector: 'cqgeu7',
  jobSearchDuration: 'mn28jt',
  trainingFit: 'b8mjm9',
  salary: 'tmzijc',
  avgIncome: 'g130px',
  searchMethod: '196kig',
  hiringMethod: 'tpgdsl',
  softSkills: 'p0nfcp',
  postGradCourse: 'yypf89',
  giaiPhap: 'mqbih3',
  hiringDate: '4dyqef',
} as const;
