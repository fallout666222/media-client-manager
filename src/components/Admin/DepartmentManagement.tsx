
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface DepartmentManagementProps {
  departments: Department[];
  onAddDepartment: (department: Omit<Department, "id">) => void;
  onDeleteDepartment: (id: string) => void; // Keeping the prop to maintain interface compatibility
}

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ departments, onAddDepartment, onDeleteDepartment }) => {
  const [departmentName, setDepartmentName] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const { toast } = useToast();

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!departmentName.trim()) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { createDepartment } = await import('@/integrations/supabase/database');
      const { data, error } = await createDepartment({ 
        name: departmentName,
        description: departmentDescription 
      });
      
      if (error) throw error;
      
      if (data) {
        onAddDepartment({
          name: data.name,
          description: data.description
        });
        
        setDepartmentName('');
        setDepartmentDescription('');
        
        toast({
          title: "Success",
          description: "Department added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding department:', error);
      toast({
        title: "Error",
        description: "Failed to add department",
        variant: "destructive",
      });
    }
  };

  // Removing the handleDeleteDepartment function as we no longer want this functionality

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Manage Departments</h2>
      <form onSubmit={handleAddDepartment} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="departmentName">Department Name</Label>
          <Input
            type="text"
            id="departmentName"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            placeholder="Enter department name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="departmentDescription">Description</Label>
          <Textarea
            id="departmentDescription"
            value={departmentDescription}
            onChange={(e) => setDepartmentDescription(e.target.value)}
            placeholder="Enter department description"
          />
        </div>
        <Button type="submit">Add Department</Button>
      </form>
      <Table>
        <TableCaption>A list of your departments.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            {/* Removed the Actions column header */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((department) => (
            <TableRow key={department.id}>
              <TableCell className="font-medium">{department.name}</TableCell>
              <TableCell>{department.description}</TableCell>
              {/* Removed the delete button cell */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepartmentManagement;
