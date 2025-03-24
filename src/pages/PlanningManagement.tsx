import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllPlanningVersions, 
  createPlanningVersion, 
  updatePlanningVersion, 
  deletePlanningVersion, 
  fillActualHours,
  getAllYears,
  createYear,
  YearData
} from '@/integrations/supabase/database';
import * as db from '@/integrations/supabase/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlanningVersionAddForm } from '@/components/Planning/PlanningVersionAddForm';
import { YearAddForm } from '@/components/Planning/YearAddForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlanningVersion {
  id: string;
  name: string;
  year: string;
  q1_locked: boolean;
  q2_locked: boolean;
  q3_locked: boolean;
  q4_locked: boolean;
  created_at: string;
}

const PlanningManagement = () => {
  const [planningVersions, setPlanningVersions] = useState<PlanningVersion[]>([]);
  const [years, setYears] = useState<YearData[]>([]);
  const [customWeeks, setCustomWeeks] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<{id: string, year: string} | null>(null);
  const [activeTab, setActiveTab] = useState('versions');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data: versionsData, error: versionsError } = await getAllPlanningVersions();
      
      if (versionsError) throw versionsError;
      setPlanningVersions(versionsData || []);
      
      const { data: yearsData, error: yearsError } = await getAllYears();
      if (yearsError) throw yearsError;
      setYears(yearsData || []);
      
      const { data: weeksData, error: weeksError } = await db.getCustomWeeks();
      if (weeksError) throw weeksError;
      
      const years = [...new Set(weeksData?.map(week => {
        const date = new Date(week.period_from);
        return date.getFullYear().toString();
      }) || [])];
      
      const yearsWithIds = years.map(year => ({ 
        id: year as string, 
        name: year as string 
      }));
      
      setCustomWeeks(yearsWithIds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const handleAddVersion = async (data: {
    name: string;
    year: string;
    q1_locked: boolean;
    q2_locked: boolean;
    q3_locked: boolean; 
    q4_locked: boolean;
  }) => {
    try {
      setIsSubmitting(true);
      const { data: newVersion, error } = await createPlanningVersion(
        data.name,
        data.year,
        data.q1_locked,
        data.q2_locked,
        data.q3_locked,
        data.q4_locked
      );
      
      if (error) throw error;
      
      await fetchData();
      
      toast({
        title: "Success",
        description: "Planning version created successfully"
      });
    } catch (error) {
      console.error('Error creating planning version:', error);
      toast({
        title: "Error",
        description: "Failed to create planning version",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddYear = async (data: YearData) => {
    try {
      setIsSubmitting(true);
      const { data: newYear, error } = await createYear(data);
      
      if (error) throw error;
      
      await fetchData();
      
      toast({
        title: "Success",
        description: "Year data created successfully"
      });
    } catch (error: any) {
      console.error('Error creating year data:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "A record for this year already exists",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create year data",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVersion = async (id: string, data: {
    name?: string;
    year?: string;
    q1_locked?: boolean;
    q2_locked?: boolean;
    q3_locked?: boolean;
    q4_locked?: boolean;
  }) => {
    try {
      const { data: updatedVersion, error } = await updatePlanningVersion(id, data);
      
      if (error) throw error;
      
      setPlanningVersions(prev => 
        prev.map(version => version.id === id ? updatedVersion : version)
      );
      
      toast({
        title: "Success",
        description: "Planning version updated successfully"
      });
    } catch (error) {
      console.error('Error updating planning version:', error);
      toast({
        title: "Error",
        description: "Failed to update planning version",
        variant: "destructive"
      });
    }
  };

  const handleFillActualHours = async () => {
    if (!selectedVersion) return;
    
    try {
      setIsProcessing(true);
      const { error } = await fillActualHours(selectedVersion.id, selectedVersion.year);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Actual hours have been filled successfully"
      });
    } catch (error) {
      console.error('Error filling actual hours:', error);
      toast({
        title: "Error",
        description: "Failed to fill actual hours",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsConfirmDialogOpen(false);
      setSelectedVersion(null);
    }
  };

  const openConfirmDialog = (version: PlanningVersion) => {
    setSelectedVersion({
      id: version.id,
      year: version.year
    });
    setIsConfirmDialogOpen(true);
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="versions">Planning Versions</TabsTrigger>
          <TabsTrigger value="years">Years</TabsTrigger>
        </TabsList>
        
        <TabsContent value="versions">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Planning Version</CardTitle>
            </CardHeader>
            <CardContent>
              <PlanningVersionAddForm 
                onSubmit={handleAddVersion} 
                availableYears={years.map(year => year.year)} 
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Planning Versions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Loading...</div>
              ) : planningVersions.length === 0 ? (
                <div className="py-6 text-center">No planning versions found</div>
              ) : (
                <Table>
                  <TableCaption>List of planning versions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Q1 Locked</TableHead>
                      <TableHead>Q2 Locked</TableHead>
                      <TableHead>Q3 Locked</TableHead>
                      <TableHead>Q4 Locked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planningVersions.map(version => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.name}</TableCell>
                        <TableCell>{version.year}</TableCell>
                        <TableCell>
                          <Checkbox 
                            checked={version.q1_locked} 
                            onCheckedChange={(checked) => {
                              handleUpdateVersion(version.id, { q1_locked: !!checked });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox 
                            checked={version.q2_locked} 
                            onCheckedChange={(checked) => {
                              handleUpdateVersion(version.id, { q2_locked: !!checked });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox 
                            checked={version.q3_locked} 
                            onCheckedChange={(checked) => {
                              handleUpdateVersion(version.id, { q3_locked: !!checked });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox 
                            checked={version.q4_locked} 
                            onCheckedChange={(checked) => {
                              handleUpdateVersion(version.id, { q4_locked: !!checked });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => openConfirmDialog(version)}
                            disabled={isProcessing}
                          >
                            Fill Actual Hours
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="years">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add Year with Monthly Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <YearAddForm 
                onSubmit={handleAddYear}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Years Data</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-6 text-center">Loading...</div>
              ) : years.length === 0 ? (
                <div className="py-6 text-center">No years data found</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>List of years with monthly hour data</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Jan</TableHead>
                        <TableHead>Feb</TableHead>
                        <TableHead>Mar</TableHead>
                        <TableHead>Apr</TableHead>
                        <TableHead>May</TableHead>
                        <TableHead>Jun</TableHead>
                        <TableHead>Jul</TableHead>
                        <TableHead>Aug</TableHead>
                        <TableHead>Sep</TableHead>
                        <TableHead>Oct</TableHead>
                        <TableHead>Nov</TableHead>
                        <TableHead>Dec</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {years.map(year => (
                        <TableRow key={year.id}>
                          <TableCell className="font-medium">{year.year}</TableCell>
                          <TableCell>{year.jan}</TableCell>
                          <TableCell>{year.feb}</TableCell>
                          <TableCell>{year.mar}</TableCell>
                          <TableCell>{year.apr}</TableCell>
                          <TableCell>{year.may}</TableCell>
                          <TableCell>{year.jun}</TableCell>
                          <TableCell>{year.jul}</TableCell>
                          <TableCell>{year.aug}</TableCell>
                          <TableCell>{year.sep}</TableCell>
                          <TableCell>{year.oct}</TableCell>
                          <TableCell>{year.nov}</TableCell>
                          <TableCell>{year.dec}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fill Actual Hours</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace planning hours with actual hours from timesheets for all locked quarters.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVersion(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFillActualHours} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanningManagement;
