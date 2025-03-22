
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlanningVersion } from '@/types/planning';
import { 
  getPlanningVersions, 
  createPlanningVersion, 
  updatePlanningVersion, 
  deletePlanningVersion,
  getYearsFromCustomWeeks
} from '@/integrations/supabase/database/planning';

const PlanningManagement = () => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<PlanningVersion[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionYear, setNewVersionYear] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fetch planning versions and available years
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: versionsData } = await getPlanningVersions();
      const yearsData = await getYearsFromCustomWeeks();
      
      setVersions(versionsData || []);
      setAvailableYears(yearsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load planning versions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVersion = async () => {
    if (!newVersionName.trim() || !newVersionYear) {
      toast({
        title: "Error",
        description: "Please enter a name and select a year",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlanningVersion(newVersionName, newVersionYear);
      toast({
        title: "Success",
        description: "Planning version created successfully",
      });
      setNewVersionName('');
      setNewVersionYear('');
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: "Error",
        description: "Failed to create planning version",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVersion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this planning version?')) return;
    
    try {
      await deletePlanningVersion(id);
      toast({
        title: "Success",
        description: "Planning version deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: "Error",
        description: "Failed to delete planning version",
        variant: "destructive",
      });
    }
  };

  const handleQuarterLockChange = async (
    version: PlanningVersion, 
    quarter: 'q1_locked' | 'q2_locked' | 'q3_locked' | 'q4_locked',
    checked: boolean
  ) => {
    setSavingId(version.id);
    try {
      await updatePlanningVersion(version.id, {
        [quarter]: checked
      });
      fetchData();
      toast({
        title: "Success",
        description: `Quarter ${quarter.charAt(1)} ${checked ? 'locked' : 'unlocked'} successfully`,
      });
    } catch (error) {
      console.error('Error updating quarter lock status:', error);
      toast({
        title: "Error",
        description: "Failed to update quarter lock status",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning Versions Management</h1>
        <div className="flex gap-4">
          <Link to="/planning">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Planning
            </Button>
          </Link>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Planning Version</DialogTitle>
                <DialogDescription>
                  Enter details for the new planning version.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="e.g. Planning 2023"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Select 
                    value={newVersionYear} 
                    onValueChange={setNewVersionYear}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-center">Q1 Locked</TableHead>
              <TableHead className="text-center">Q2 Locked</TableHead>
              <TableHead className="text-center">Q3 Locked</TableHead>
              <TableHead className="text-center">Q4 Locked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No planning versions found. Create your first one!
                </TableCell>
              </TableRow>
            ) : (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">{version.name}</TableCell>
                  <TableCell>{version.year}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={version.q1_locked || false}
                      disabled={savingId === version.id}
                      onCheckedChange={(checked) => 
                        handleQuarterLockChange(version, 'q1_locked', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={version.q2_locked || false}
                      disabled={savingId === version.id}
                      onCheckedChange={(checked) => 
                        handleQuarterLockChange(version, 'q2_locked', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={version.q3_locked || false}
                      disabled={savingId === version.id}
                      onCheckedChange={(checked) => 
                        handleQuarterLockChange(version, 'q3_locked', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox 
                      checked={version.q4_locked || false}
                      disabled={savingId === version.id}
                      onCheckedChange={(checked) => 
                        handleQuarterLockChange(version, 'q4_locked', !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteVersion(version.id)}
                      disabled={savingId === version.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PlanningManagement;
