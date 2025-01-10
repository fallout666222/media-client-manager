import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Department, Employee } from "@/types/timesheet"

interface TimeSheetFiltersProps {
  departments: Department[]
  employees: Employee[]
  selectedDepartment: string
  selectedEmployee: string
  onDepartmentChange: (department: string) => void
  onEmployeeChange: (employee: string) => void
}

export const TimeSheetFilters = ({
  departments,
  employees,
  selectedDepartment,
  selectedEmployee,
  onDepartmentChange,
  onEmployeeChange,
}: TimeSheetFiltersProps) => {
  const filteredEmployees = selectedDepartment
    ? employees.filter(emp => emp.department === selectedDepartment)
    : employees

  return (
    <div className="flex gap-4">
      <div className="w-[200px]">
        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id || "default"}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[200px]">
        <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {filteredEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id || "default"}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}