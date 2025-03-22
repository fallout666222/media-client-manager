
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlanningVersionForm } from '@/components/Planning/PlanningVersionForm';
import { 
  getAllPlanningVersions, 
  createPlanningVersion, 
  updatePlanningVersion,
  deletePlanningVersion,
  getCustomWeeks
} from '@/integrations/supabase/database';
import { PlanningVersion } from '@/hooks/usePlanningData';

export default function PlanningManagement() {
  const [versions, setVersions] = useState<PlanningVersion[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PlanningVersion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load planning versions and years
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch planning versions
        const { data: versionsData, error: versionsError } = await getAllPlanningVersions();
        if (versionsError) throw versionsError;
        setVersions(versionsData || []);

        // Fetch custom weeks to extract years
        const { data: weeksData, error: weeksError } = await getCustomWeeks();
        if (weeksError) throw weeksError;
        
        // Extract unique years from custom weeks
        const uniqueYears = new Set<string>();
        weeksData?.forEach(week => {
          const year = new Date(week.period_from).getFullYear().toString();
          uniqueYears.add(year);
        });
        
        setYears(Array.from(uniqueYears).sort());
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load planning data',
          variant: 'destructive'
        });
      }
    };
    
    fetchData();
  }, [toast]);

  const handleCreateVersion = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await createPlanningVersion(
        values.name,
        values.year,
        values.q1_locked,
        values.q2_locked,
        values.q3_locked,
        values.q4_locked
      );
      
      if (error) throw error;
      
      setVersions([data, ...versions]);
      toast({
        title: 'Success',
        description: 'Planning version created successfully',
      });
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to create planning version',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVersion = async (values: any) => {
    if (!selectedVersion) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await updatePlanningVersion(
        selectedVersion.id,
        values
      );
      
      if (error) throw error;
      
      setVersions(versions.map(v => v.id === data.id ? data : v));
      toast({
        title: 'Success',
        description: 'Planning version updated successfully',
      });
      setOpenDialog(false);
      setSelectedVersion(null);
    } catch (error) {
      console.error('Error updating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to update planning version',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await deletePlanningVersion(deleteId);
      
      if (error) throw error;
      
      setVersions(versions.filter(v => v.id !== deleteId));
      toast({
        title: 'Success',
        description: 'Planning version deleted successfully',
      });
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting version:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete planning version',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (version: PlanningVersion) => {
    setSelectedVersion(version);
    setOpenDialog(true);
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning Management</h1>
        <Link to="/planning">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Planning
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              New Planning Version
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedVersion ? "Edit Planning Version" : "Create New Planning Version"}
              </DialogTitle>
            </DialogHeader>
            <PlanningVersionForm
              onSubmit={selectedVersion ? handleUpdateVersion : handleCreateVersion}
              initialValues={selectedVersion || undefined}
              availableYears={years}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow overflow-hidden">
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
            {versions.length > 0 ? (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">{version.name}</TableCell>
                  <TableCell>{version.year}</TableCell>
                  <TableCell className="text-center">
                    {version.q1_locked ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {version.q2_locked ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {version.q3_locked ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {version.q4_locked ? "✓" : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(version)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeleteId(version.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this planning version?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteId(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteVersion}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No planning versions found. Create a new version to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
