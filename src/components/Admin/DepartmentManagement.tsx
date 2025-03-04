
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Department } from "@/types/timesheet";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash, Plus } from "lucide-react";

interface DepartmentManagementProps {
  departments: Department[];
  onAddDepartment: (department: Omit<Department, "id">) => void;
  onDeleteDepartment: (id: string) => void;
}

export const DepartmentManagement = ({ 
  departments, 
  onAddDepartment, 
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

    // Check if department name already exists
    if (departments.some(dept => dept.name.toLowerCase() === departmentName.toLowerCase())) {
      toast({
        title: "Error",
        description: "Department with this name already exists",
        variant: "destructive",
      });
      return;
    }

    onAddDepartment({ name: departmentName });
    setDepartmentName("");
    toast({
      title: "Success",
      description: "Department added successfully",
    });
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Department Management</h2>
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            placeholder="Department Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
          />
        </div>
        <Button type="submit" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </form>
      
      {departments.length > 0 && (
        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
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
                      size="sm"
                      onClick={() => onDeleteDepartment(department.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
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
