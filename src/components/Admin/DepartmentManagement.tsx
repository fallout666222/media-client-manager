
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { Department } from "@/types/timesheet";

interface DepartmentManagementProps {
  onCreateDepartment: (department: Department) => void;
  departments: Department[];
  onDeleteDepartment: (id: string) => void;
}

export const DepartmentManagement = ({ 
  onCreateDepartment,
  departments,
  onDeleteDepartment
}: DepartmentManagementProps) => {
  const [departmentName, setDepartmentName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      toast({
        title: "Error",
        description: "Department name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const newDepartment: Department = {
      id: crypto.randomUUID(),
      name: departmentName,
    };

    onCreateDepartment(newDepartment);
    setDepartmentName("");
    toast({
      title: "Success",
      description: "Department created successfully",
    });
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Department Management</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
            />
          </div>
          <Button type="submit">Add Department</Button>
        </div>
      </form>

      {departments.length > 0 && (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department Name</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell>{department.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteDepartment(department.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
