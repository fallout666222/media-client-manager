
import React, { useState, useEffect } from 'react';
import { 
  createPlanningVersion, 
  updatePlanningVersionLocks,
  getPlanningVersions
} from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { PlanningVersion } from '@/types/planning';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { PlusCircle, Edit, RefreshCw } from "lucide-react";

interface VersionFormData {
  name: string;
  year: string;
}

export const VersionManagement = () => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<PlanningVersion[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [isEditVersionOpen, setIsEditVersionOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<PlanningVersion | null>(null);
  
  const form = useForm<VersionFormData>({
    defaultValues: {
      name: '',
      year: ''
    }
  });

  // Fetch planning versions and available years
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data } = await getPlanningVersions();
      if (data) {
        setVersions(data as PlanningVersion[]);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      toast({
        title: "Error",
        description: "Failed to load planning versions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique years from custom weeks
  const fetchAvailableYears = async () => {
    try {
      // Get unique years from custom weeks
      const { data, error } = await fetch('/api/planning/available-years').then(res => res.json());
      
      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        // For demo purposes, we'll just use years from 2020 to 2030
        setYears(Array.from({length: 11}, (_, i) => (2020 + i).toString()));
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

  useEffect(() => {
    fetchVersions();
    fetchAvailableYears();
  }, []);

  const handleCreateVersion = async (formData: VersionFormData) => {
    try {
      await createPlanningVersion(formData.name, formData.year);
      
      toast({
        title: "Success",
        description: "Version created successfully",
      });
      
      setIsNewVersionOpen(false);
      form.reset();
      fetchVersions();
    } catch (error) {
      console.error("Error creating version:", error);
      toast({
        title: "Error",
        description: "Failed to create version",
        variant: "destructive",
      });
    }
  };

  const handleLockToggle = async (versionId: string, field: string, value: boolean) => {
    try {
      const updatedFields: Partial<PlanningVersion> = {
        [field]: value
      };
      
      await updatePlanningVersionLocks(versionId, updatedFields);
      
      toast({
        title: "Success",
        description: "Quarter lock status updated",
      });
      
      fetchVersions();
    } catch (error) {
      console.error("Error updating version locks:", error);
      toast({
        title: "Error",
        description: "Failed to update quarter lock status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (version: PlanningVersion) => {
    setSelectedVersion(version);
    setIsEditVersionOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Planning Versions Management</h2>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={fetchVersions} 
            variant="outline" 
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Dialog open={isNewVersionOpen} onOpenChange={setIsNewVersionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1">
                <PlusCircle className="h-4 w-4" /> New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Planning Version</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleCreateVersion)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Version Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Budget 2024" 
                    {...form.register('name', { required: true })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select 
                    onValueChange={(value) => form.setValue('year', value)} 
                    defaultValue={form.getValues('year')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Version</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading versions...</div>
      ) : (
        <div className="border rounded-md">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Version Name</th>
                <th className="text-left p-3 font-medium">Year</th>
                <th className="text-center p-3 font-medium">Q1 Locked</th>
                <th className="text-center p-3 font-medium">Q2 Locked</th>
                <th className="text-center p-3 font-medium">Q3 Locked</th>
                <th className="text-center p-3 font-medium">Q4 Locked</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted-foreground">
                    No planning versions found.
                  </td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className="border-t">
                    <td className="p-3">{version.name}</td>
                    <td className="p-3">{version.year}</td>
                    <td className="p-3 text-center">
                      <Switch 
                        checked={version.q1_locked || false} 
                        onCheckedChange={(checked) => handleLockToggle(version.id, 'q1_locked', checked)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Switch 
                        checked={version.q2_locked || false} 
                        onCheckedChange={(checked) => handleLockToggle(version.id, 'q2_locked', checked)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Switch 
                        checked={version.q3_locked || false} 
                        onCheckedChange={(checked) => handleLockToggle(version.id, 'q3_locked', checked)}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Switch 
                        checked={version.q4_locked || false} 
                        onCheckedChange={(checked) => handleLockToggle(version.id, 'q4_locked', checked)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(version)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Version Dialog */}
      {selectedVersion && (
        <Dialog open={isEditVersionOpen} onOpenChange={setIsEditVersionOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Planning Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Version Name</Label>
                <Input 
                  id="edit-name" 
                  value={selectedVersion.name} 
                  onChange={(e) => setSelectedVersion({...selectedVersion, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-year">Year</Label>
                <Select 
                  value={selectedVersion.year}
                  onValueChange={(value) => setSelectedVersion({...selectedVersion, year: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="block mb-2">Quarter Locks</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="q1-lock" 
                      checked={selectedVersion.q1_locked || false}
                      onCheckedChange={(checked) => setSelectedVersion({
                        ...selectedVersion, 
                        q1_locked: checked as boolean
                      })}
                    />
                    <label htmlFor="q1-lock" className="text-sm font-medium">
                      Q1 Locked
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="q2-lock" 
                      checked={selectedVersion.q2_locked || false}
                      onCheckedChange={(checked) => setSelectedVersion({
                        ...selectedVersion, 
                        q2_locked: checked as boolean
                      })}
                    />
                    <label htmlFor="q2-lock" className="text-sm font-medium">
                      Q2 Locked
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="q3-lock" 
                      checked={selectedVersion.q3_locked || false}
                      onCheckedChange={(checked) => setSelectedVersion({
                        ...selectedVersion, 
                        q3_locked: checked as boolean
                      })}
                    />
                    <label htmlFor="q3-lock" className="text-sm font-medium">
                      Q3 Locked
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="q4-lock" 
                      checked={selectedVersion.q4_locked || false}
                      onCheckedChange={(checked) => setSelectedVersion({
                        ...selectedVersion, 
                        q4_locked: checked as boolean
                      })}
                    />
                    <label htmlFor="q4-lock" className="text-sm font-medium">
                      Q4 Locked
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={async () => {
                  try {
                    await updatePlanningVersionLocks(
                      selectedVersion.id, 
                      {
                        name: selectedVersion.name,
                        year: selectedVersion.year,
                        q1_locked: selectedVersion.q1_locked,
                        q2_locked: selectedVersion.q2_locked,
                        q3_locked: selectedVersion.q3_locked,
                        q4_locked: selectedVersion.q4_locked
                      }
                    );
                    toast({
                      title: "Success",
                      description: "Version updated successfully",
                    });
                    setIsEditVersionOpen(false);
                    fetchVersions();
                  } catch (error) {
                    console.error("Error updating version:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update version",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
