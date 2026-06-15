/**
 * Legend giải mã file Excel "Báo cáo tổng hợp" — format mới: 1 sheet duy nhất,
 * dòng 1 là header, mỗi dòng tiếp theo = 1 sinh viên. Mỗi cột đã chứa sẵn giá trị
 * cuối cùng (text/số), KHÔNG còn dạng lưới đánh "x" như format cũ.
 *
 * ANSWER_KEYS = question_key của "form 103" (xem default-employment-survey.seed-data.ts),
 * dùng để build `answers` JSON lưu vào alumni_batch_response.answers.
 */

export const ANSWER_KEYS = {
  studentCode: '80ysrp',
  fullName: 'g183rm',
  gender: 'hn98q4',
  dob: 'htcuki',
  majorCode: 'lbxfns',
  cccd: 'ees6gh',
  courseYear: 'il1ap2',
  majorName: 'ni0dcj',
  phone: 'pe90b3',
  email: 'vctubh',
  employmentStatus: 'x0ya9z',
  employerName: 'mpju4t',
  workLocation: '9a814s',
  hiringDate: '4dyqef',
  jobTitle: 'rao44c',
  workSector: 'cqgeu7',
  jobSearchDuration: 'mn28jt',
  jobRelevance: 'vwje9g',
  qualificationFit: 'lelshm',
  trainingFit: 'b8mjm9',
  salary: 'tmzijc',
  avgIncome: 'g130px',
  searchMethod: '196kig',
  hiringMethod: 'tpgdsl',
  softSkills: 'p0nfcp',
  postGradCourse: 'yypf89',
  giaiPhap: 'mqbih3',
} as const;

export type AnswerField = keyof typeof ANSWER_KEYS;

/**
 * Tên cột Excel (đã chuẩn hoá: bỏ dấu, lowercase, gộp khoảng trắng) -> field của ANSWER_KEYS.
 * Dùng để đọc dòng header (dòng 1) và xác định cột nào ứng với câu trả lời nào.
 */
export const EXCEL_COLUMN_FIELDS: Record<string, AnswerField> = {
  'ma sinh vien': 'studentCode',
  'ho va ten': 'fullName',
  'ngay sinh': 'dob',
  'gioi tinh': 'gender',
  'so cccd cmtnd': 'cccd',
  'ma nganh': 'majorCode',
  'ten nganh': 'majorName',
  'khoa hoc': 'courseYear',
  'dien thoai': 'phone',
  email: 'email',
  'tinh trang viec lam': 'employmentStatus',
  'ten don vi tuyen dung': 'employerName',
  'dia chi don vi tuyen dung': 'workLocation',
  'ngay tuyen dung': 'hiringDate',
  'chuc vu vi tri viec lam': 'jobTitle',
  'khu vuc lam viec': 'workSector',
  'thoi gian co viec lam sau tot nghiep': 'jobSearchDuration',
  'muc do phu hop voi nganh dao tao': 'jobRelevance',
  'muc do phu hop voi trinh do chuyen mon': 'qualificationFit',
  'kien thuc ky nang hoc duoc tu nha truong': 'trainingFit',
  'muc luong khoi diem trieu dong': 'salary',
  'thu nhap binh quan thang': 'avgIncome',
  'hinh thuc tuyen dung': 'hiringMethod',
  'hinh thuc tim viec lam': 'searchMethod',
  'ky nang mem can thiet cho cong viec': 'softSkills',
  'khoa hoc can tham gia them sau tot nghiep': 'postGradCourse',
  'giai phap tang ty le sinh vien co viec lam dung nganh': 'giaiPhap',
};

/** Các field có giá trị multi-select, các lựa chọn cách nhau bằng dấu phẩy trong Excel */
export const MULTI_SELECT_FIELDS: AnswerField[] = ['searchMethod', 'softSkills', 'postGradCourse', 'giaiPhap'];

/** Các field cần parse từ "dd/mm/yyyy" -> "yyyy-mm-dd" */
export const DATE_FIELDS: AnswerField[] = ['dob', 'hiringDate'];

/** Các field cần parse thành số */
export const NUMBER_FIELDS: AnswerField[] = ['salary'];
