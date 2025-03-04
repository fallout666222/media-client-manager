
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserFormData, Department } from "@/types/timesheet";

interface UserManagementProps {
  onCreateUser: (userData: UserFormData) => void;
  departments?: Department[];
}

export const UserManagement = ({ onCreateUser, departments = [] }: UserManagementProps) => {
  const [formData, setFormData] = useState<UserFormData & { departmentId?: string }>({
    username: "",
    password: "",
    role: "user",
    departmentId: undefined,
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    onCreateUser(formData);
    setFormData({ username: "", password: "", role: "user", departmentId: undefined });
    toast({
      title: "Success",
      description: "User created successfully",
    });
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Create New User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <div>
          <Select
            value={formData.role}
            onValueChange={(value: 'admin' | 'user' | 'manager') =>
              setFormData({ ...formData, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {departments.length > 0 && (
          <div>
            <Select
              value={formData.departmentId || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, departmentId: value === "" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" className="w-full">
          Create User
        </Button>
      </form>
    </div>
  );
};
