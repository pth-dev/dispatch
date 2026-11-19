import { http } from '@/services/http'
import { DepartmentSchema, type Department } from '@/schemas/department'

/**
 * Client-side department source. The mock data module stays in `src/mocks/`
 * and is never imported by production code.
 */
export async function fetchDepartments(): Promise<Department[]> {
  const data = await http<unknown>('/departments')
  return DepartmentSchema.array().parse(data)
}
