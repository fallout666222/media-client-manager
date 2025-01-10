import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department, Employee } from '@/types/timesheet';

interface TimeSheetFiltersProps {
  departments: Department[];
  employees: Employee[];
  selectedDepartment: string;
  selectedEmployee: string;
  onDepartmentChange: (department: string) => void;
  onEmployeeChange: (employee: string) => void;
}

export const TimeSheetFilters = ({
  departments,
  employees,
  selectedDepartment,
  selectedEmployee,
  onDepartmentChange,
  onEmployeeChange,
}: TimeSheetFiltersProps) => {
  const filteredEmployees = employees.filter(
    emp => !selectedDepartment || emp.department === selectedDepartment
  );

  return (
    <div className="flex gap-4 mb-4">
      <div className="w-[200px]">
        <Select
          value={selectedDepartment}
          onValueChange={onDepartmentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[200px]">
        <Select
          value={selectedEmployee}
          onValueChange={onEmployeeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {filteredEmployees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};