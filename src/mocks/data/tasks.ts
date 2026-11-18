import { fakerVI as faker } from '@faker-js/faker'
import type { Task, TaskStatus } from '@/schemas/task'
import { DEPARTMENTS, DEPARTMENT_NAME_BY_ID } from './departments'

faker.seed(2026)

const INITIAL_NAMED_TASKS: Task[] = [
  {
    id: 'NV-2026-0891',
    title: 'Module API đồng bộ dữ liệu V16.8',
    description: 'Xây dựng và kiểm thử toàn bộ API đồng bộ dữ liệu realtime giữa hệ thống kho và dispatch trung tâm. Đảm bảo throughput đạt tối thiểu 2,500 req/s và SLA < 120ms.',
    department: 'it',
    departmentName: DEPARTMENT_NAME_BY_ID['it'],
    assignee: 'Trần Thị Mai',
    assigneeAvatar: '',
    createdBy: 'Nguyễn An',
    createdAt: '2026-11-01',
    dueDate: '2026-11-20',
    status: 'pending',
    urgent: true,
    progress: 85,
    checklist: [
      { id: 'c1', text: 'Tài liệu kỹ thuật API Swagger / OpenAPI 3.0', completed: true },
      { id: 'c2', text: 'Unit test & Integration test độ bao phủ > 80%', completed: true },
      { id: 'c3', text: 'Kết quả Load Testing k6 đạt SLA 120ms', completed: true },
      { id: 'c4', text: 'Biên bản nghiệm thu an toàn thông tin BP. IT', completed: true },
    ],
    timeline: [
      { id: 't1', time: '01/11/2026 08:30', actor: 'Nguyễn An', action: 'Khởi tạo nhiệm vụ', note: 'Giao cho Trần Thị Mai' },
      { id: 't2', time: '05/11/2026 14:15', actor: 'Trần Thị Mai', action: 'Bắt đầu xử lý', note: 'Triển khai Sprint 1' },
      { id: 't3', time: '15/11/2026 17:00', actor: 'Trần Thị Mai', action: 'Nộp báo cáo nghiệm thu', note: 'Chờ Quản lý phê duyệt' },
    ],
    attachments: [
      { id: 'a1', name: 'api_spec_v16.8.pdf', size: '2.4 MB' },
      { id: 'a2', name: 'k6_load_test_results.json', size: '420 KB' },
    ],
    comments: [
      { id: 'm1', author: 'Nguyễn An', time: '02/11/2026 09:00', content: 'Lưu ý kiểm tra kỹ token refresh và header x-correlation-id nhé Mai.' },
      { id: 'm2', author: 'Trần Thị Mai', time: '02/11/2026 09:25', content: 'Vâng anh, em đã tích hợp interceptor vào bộ client rồi ạ.' },
    ],
  },
  {
    id: 'NV-2026-0874',
    title: 'Triển khai hạ tầng mạng chi nhánh Đà Nẵng',
    description: 'Lắp đặt switch quang, cấu hình router Cisco và phân chia VLAN cho 120 vị trí làm việc tại văn phòng mới Đà Nẵng.',
    department: 'technical',
    departmentName: DEPARTMENT_NAME_BY_ID['technical'],
    assignee: 'Lê Hoàng Nam',
    assigneeAvatar: '',
    createdBy: 'Phạm Văn Đức',
    createdAt: '2026-11-05',
    dueDate: '2026-11-25',
    status: 'in_progress',
    urgent: false,
    progress: 60,
    checklist: [
      { id: 'c1', text: 'Kéo cáp mạng CAT6 và bấm hạt mạng', completed: true },
      { id: 'c2', text: 'Cấu hình VLAN & Trunking router Cisco', completed: true },
      { id: 'c3', text: 'Kiểm thử đường truyền VPN site-to-site', completed: false },
      { id: 'c4', text: 'Bàn giao sơ đồ mạng hoàn công', completed: false },
    ],
    timeline: [
      { id: 't1', time: '05/11/2026 09:00', actor: 'Phạm Văn Đức', action: 'Khởi tạo nhiệm vụ', note: 'Giao cho Lê Hoàng Nam' },
      { id: 't2', time: '06/11/2026 10:00', actor: 'Lê Hoàng Nam', action: 'Bắt đầu xử lý' },
    ],
    attachments: [
      { id: 'a1', name: 'so_do_ha_tang_dn.dwg', size: '5.1 MB' },
    ],
    comments: [],
  },
  {
    id: 'NV-2026-0852',
    title: 'Báo cáo quyết toán thuế quý 3/2026',
    description: 'Đối soát toàn bộ hóa đơn điện tử đầu vào và đầu ra, lập tờ khai thuế GTGT và quyết toán thuế TNCN quý 3.',
    department: 'accounting',
    departmentName: DEPARTMENT_NAME_BY_ID['accounting'],
    assignee: 'Vũ Phương Linh',
    assigneeAvatar: '',
    createdBy: 'Nguyễn An',
    createdAt: '2026-10-15',
    dueDate: '2026-11-10',
    status: 'overdue',
    urgent: true,
    progress: 40,
    checklist: [
      { id: 'c1', text: 'Rà soát 1,420 hóa đơn đầu vào', completed: true },
      { id: 'c2', text: 'Đối chiếu doanh thu bán hàng với ngân hàng', completed: false },
      { id: 'c3', text: 'Lập bảng kê thuế GTGT', completed: false },
    ],
    timeline: [
      { id: 't1', time: '15/10/2026 08:00', actor: 'Nguyễn An', action: 'Khởi tạo nhiệm vụ' },
      { id: 't2', time: '11/11/2026 08:30', actor: 'Hệ thống', action: 'Cảnh báo quá hạn' },
    ],
    attachments: [],
    comments: [
      { id: 'm1', author: 'Nguyễn An', time: '11/11/2026 09:00', content: 'Linh cập nhật ngay tiến độ quyết toán nhé, đã quá hạn 1 ngày rồi.' },
    ],
  },
  {
    id: 'NV-2026-0871',
    title: 'Đào tạo nhân sự mới quy trình điều phối',
    description: 'Tổ chức khóa đào tạo trực tiếp và cấp chứng chỉ nội bộ cho 15 nhân viên điều phối hiện trường mới tuyển dụng.',
    department: 'hr',
    departmentName: DEPARTMENT_NAME_BY_ID['hr'],
    assignee: 'Hoàng Minh Tuấn',
    assigneeAvatar: '',
    createdBy: 'Trần Thị Mai',
    createdAt: '2026-10-28',
    dueDate: '2026-11-15',
    status: 'done',
    urgent: false,
    progress: 100,
    checklist: [
      { id: 'c1', text: 'Biên soạn slide đào tạo chuẩn V16.8', completed: true },
      { id: 'c2', text: 'Tổ chức 3 buổi học trực tiếp tại hội trường', completed: true },
      { id: 'c3', text: 'Bài thi trắc nghiệm đạt điểm chuẩn 80%', completed: true },
      { id: 'c4', text: 'Cấp chứng nhận hoàn thành khóa học', completed: true },
    ],
    timeline: [
      { id: 't1', time: '28/10/2026 08:00', actor: 'Trần Thị Mai', action: 'Khởi tạo nhiệm vụ' },
      { id: 't2', time: '15/11/2026 16:30', actor: 'Hoàng Minh Tuấn', action: 'Hoàn thành và bàn giao' },
    ],
    attachments: [
      { id: 'a1', name: 'danh_sach_nhan_su_dat_chuan.xlsx', size: '150 KB' },
    ],
    comments: [],
  },
  {
    id: 'NV-2026-0866',
    title: 'Cập nhật tài liệu biểu mẫu vận hành kho',
    description: 'Soạn thảo và ban hành lại biểu mẫu xuất nhập tồn theo quy chuẩn quản lý ISO 9001:2026 mới nhất.',
    department: 'operations',
    departmentName: DEPARTMENT_NAME_BY_ID['operations'],
    assignee: 'Đặng Quốc Bảo',
    assigneeAvatar: '',
    createdBy: 'Nguyễn An',
    createdAt: '2026-11-12',
    dueDate: '2026-11-30',
    status: 'draft',
    urgent: false,
    progress: 10,
    checklist: [
      { id: 'c1', text: 'Khảo sát thực tế tại kho tổng Long An', completed: true },
      { id: 'c2', text: 'Lấy ý kiến góp ý của tổ trưởng kho', completed: false },
      { id: 'c3', text: 'Trình phê duyệt ban giám đốc', completed: false },
    ],
    timeline: [
      { id: 't1', time: '12/11/2026 09:30', actor: 'Nguyễn An', action: 'Lưu nháp nhiệm vụ' },
    ],
    attachments: [],
    comments: [],
  },
]

const SAMPLE_TITLES = [
  'Kiểm toán hệ thống an toàn thông tin nội bộ quý 4',
  'Nâng cấp cụm cơ sở dữ liệu phân tán PostgreSQL lên v17',
  'Xây dựng dashboard trực quan hóa chỉ số KPI vận hành logistics',
  'Tối ưu hóa thời gian phản hồi API điều phối xe vận tải',
  'Thẩm định hồ sơ năng lực nhà cung cấp phần cứng máy chủ',
  'Lập kế hoạch bảo trì định kỳ trạm biến áp nhà máy',
  'Tự động hóa quy trình đối soát công nợ khách hàng B2B',
  'Nghiên cứu ứng dụng thuật toán tối ưu lộ trình giao hàng',
  'Tổ chức diễn tập ứng cứu sự cố rò rỉ dữ liệu',
  'Cập nhật chính sách thưởng phạt nhân viên điều phối hiện trường',
  'Rà soát hợp đồng pháp lý dự án mở rộng kho cảng Cát Lái',
  'Thiết kế giao diện mobile app cho tài xế đội xe container',
  'Xử lý khiếu nại chất lượng dịch vụ khách hàng VIP tháng 10',
  'Đánh giá hiệu suất năng lượng hệ thống kho lạnh trung tâm',
  'Triển khai chữ ký số tập trung cho toàn bộ chứng từ xuất nhập',
  'Bảo trì định kỳ hệ thống camera giám sát thông minh 24/7',
  'Xây dựng quy trình phản hồi sự cố khẩn cấp cấp độ 2',
  'Tổ chức khám sức khỏe định kỳ cho nhân viên kỹ thuật hiện trường',
  'Kiểm kê tài sản cố định và công cụ dụng cụ cuối năm',
  'Triển khai giải pháp Single Sign-On (SSO) toàn công ty',
]

const STATUSES: TaskStatus[] = [
  'new',
  'draft',
  'in_progress',
  'pending',
  'approved',
  'done',
  'overdue',
  'rejected',
]

function generateAdditionalTasks(count = 185): Task[] {
  const tasks: Task[] = []

  for (let i = 1; i <= count; i++) {
    const codeNum = (800 - i).toString().padStart(4, '0')
    const id = `NV-2026-${codeNum}`
    const dept = faker.helpers.arrayElement(DEPARTMENTS)
    const assignee = faker.helpers.arrayElement(dept.members)
    const titleTemplate = faker.helpers.arrayElement(SAMPLE_TITLES)
    const title = `${titleTemplate} (${dept.name} - Đợt ${((i % 4) + 1)})`
    const status = faker.helpers.arrayElement(STATUSES)
    const urgent = Math.random() < 0.2
    const progress = status === 'done' ? 100 : status === 'draft' ? 10 : faker.number.int({ min: 20, max: 90 })

    const createdDay = faker.number.int({ min: 1, max: 28 })
    const createdMonth = faker.number.int({ min: 8, max: 10 })
    const createdAt = `2026-${createdMonth.toString().padStart(2, '0')}-${createdDay.toString().padStart(2, '0')}`

    const dueDay = faker.number.int({ min: 1, max: 28 })
    const dueMonth = faker.number.int({ min: 11, max: 12 })
    const dueDate = `2026-${dueMonth.toString().padStart(2, '0')}-${dueDay.toString().padStart(2, '0')}`

    // Assign createdBy: 40% created by 'Nguyễn An' (to test 'created' / 'Tôi giao' scope)
    const createdBy = Math.random() < 0.4 ? 'Nguyễn An' : faker.helpers.arrayElement(['Trần Thị Mai', 'Phạm Văn Đức', 'Lê Tuấn Tú'])

    tasks.push({
      id,
      title,
      description: `Nội dung chi tiết cho nhiệm vụ ${id}. Thực hiện các hạng mục chuyên môn liên quan theo đúng quy trình và tiêu chuẩn kỹ thuật hiện hành của ${dept.name}.`,
      department: dept.id,
      departmentName: dept.name,
      assignee,
      assigneeAvatar: '',
      createdBy,
      createdAt,
      dueDate,
      status,
      urgent,
      progress,
      checklist: [
        { id: `c_${id}_1`, text: 'Kế hoạch triển khai chi tiết', completed: true },
        { id: `c_${id}_2`, text: 'Báo cáo nghiệm thu kỹ thuật', completed: progress > 50 },
      ],
      timeline: [
        { id: `t_${id}_1`, time: `${createdAt} 08:30`, actor: createdBy, action: 'Khởi tạo nhiệm vụ' },
      ],
      attachments: [],
      comments: [],
    })
  }

  return tasks
}

export const MOCK_TASKS: Task[] = [...INITIAL_NAMED_TASKS, ...generateAdditionalTasks(185)]
