export interface Department {
  id: string
  name: string
  members: string[]
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'it',
    name: 'BP. IT',
    members: ['Nguyễn An', 'Trần Thị Mai', 'Đỗ Minh Khang', 'Lý Gia Hân'],
  },
  {
    id: 'technical',
    name: 'BP. Kỹ thuật',
    members: ['Lê Hoàng Nam', 'Phạm Văn Đức', 'Trần Hữu Kiên'],
  },
  {
    id: 'accounting',
    name: 'BP. Kế toán',
    members: ['Vũ Phương Linh', 'Nguyễn Thu Trang', 'Hoàng Bích Ngọc'],
  },
  {
    id: 'hr',
    name: 'BP. Nhân sự',
    members: ['Hoàng Minh Tuấn', 'Trần Thảo Ly', 'Nguyễn Lan Hương'],
  },
  {
    id: 'sales',
    name: 'BP. Kinh doanh',
    members: ['Nguyễn Văn Thắng', 'Lê Quỳnh Nga', 'Trần Đình Trọng'],
  },
  {
    id: 'operations',
    name: 'BP. Vận hành',
    members: ['Đặng Quốc Bảo', 'Phạm Thanh Bình', 'Ngô Kiến Huy'],
  },
  {
    id: 'planning',
    name: 'BP. Kế hoạch',
    members: ['Lê Tuấn Tú', 'Vũ Thị Sen', 'Bùi Anh Tuấn'],
  },
]

export const DEPARTMENT_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((dept) => [dept.id, dept.name]),
)
