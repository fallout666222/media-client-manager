
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Check, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlanning } from '@/hooks/usePlanning';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getCustomWeeks } from '@/integrations/supabase/database';
import { useApp } from '@/contexts/AppContext';

export default function PlanningManagement() {
  const { user } = useApp();
  const { toast } = useToast();
  const {
    versions,
    versionsLoading,
    selectedVersion,
    versionLoading,
    selectedVersionId,
    setSelectedVersionId,
    createVersion,
    updateQuarterLocks,
    fillActual,
    refetchVersions
  } = usePlanning();
  
  const [newVersionName, setNewVersionName] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isSavingLocks, setIsSavingLocks] = useState(false);
  const [isFillingActual, setIsFillingActual] = useState(false);
  const [localLockState, setLocalLockState] = useState({
    q1: false,
    q2: false,
    q3: false,
    q4: false
  });
  const [showFillActualDialog, setShowFillActualDialog] = useState(false);
  
  // Get available years from custom weeks
  const { data: customWeeks = [] } = useQuery({
    queryKey: ['custom-weeks'],
    queryFn: async () => {
      const { data } = await getCustomWeeks();
      return data || [];
    }
  });
  
  // Extract unique years from custom weeks
  const years = [...new Set(customWeeks.map(week => {
    const date = new Date(week.period_from);
    return date.getFullYear().toString();
  }))].sort();
  
  // Update local lock state when selected version changes
  React.useEffect(() => {
    if (selectedVersion) {
      setLocalLockState({
        q1: selectedVersion.q1_locked,
        q2: selectedVersion.q2_locked,
        q3: selectedVersion.q3_locked, 
        q4: selectedVersion.q4_locked
      });
    }
  }, [selectedVersion]);
  
  // Handle version selection
  const handleVersionSelect = (versionId: string) => {
    setSelectedVersionId(versionId);
  };
  
  // Create new version
  const handleCreateVersion = async () => {
    if (!newVersionName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a version name',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedYear) {
      toast({
        title: 'Error',
        description: 'Please select a year',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsCreatingVersion(true);
      const newVersion = await createVersion(newVersionName.trim(), selectedYear);
      
      if (newVersion) {
        setNewVersionName('');
        setSelectedYear('');
      }
    } finally {
      setIsCreatingVersion(false);
    }
  };
  
  // Handle quarter lock checkbox changes
  const handleLockChange = (quarter: 'q1' | 'q2' | 'q3' | 'q4', checked: boolean) => {
    setLocalLockState(prev => ({
      ...prev,
      [quarter]: checked
    }));
  };
  
  // Save lock changes
  const handleSaveLocks = async () => {
    if (!selectedVersionId) return;
    
    try {
      setIsSavingLocks(true);
      await updateQuarterLocks(
        selectedVersionId,
        localLockState.q1,
        localLockState.q2,
        localLockState.q3,
        localLockState.q4
      );
    } finally {
      setIsSavingLocks(false);
    }
  };
  
  // Fill actual hours
  const handleFillActual = async () => {
    if (!selectedVersion) return;
    
    try {
      setIsFillingActual(true);
      await fillActual(selectedVersion.id, selectedVersion.year);
      setShowFillActualDialog(false);
    } finally {
      setIsFillingActual(false);
    }
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-4 pt-16">
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="mt-2">You need admin privileges to access this page.</p>
        <Link to="/" className="inline-block mt-4">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning Management</h1>
        <div className="flex gap-2">
          <Link to="/planning">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Planning
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Version Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create Planning Version</CardTitle>
            <CardDescription>
              Create a new planning version for a specific year
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-name">Version Name</Label>
              <Input 
                id="version-name" 
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="e.g., Budget 2023, Forecast Q2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Years are based on custom weeks in the system
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreateVersion} 
              disabled={isCreatingVersion || !newVersionName.trim() || !selectedYear}
              className="w-full"
            >
              {isCreatingVersion ? 'Creating...' : 'Create Version'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Version Management Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Manage Planning Versions</CardTitle>
            <CardDescription>
              Lock quarters and fill with actual data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {versionsLoading ? (
              <div className="text-center py-4">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="text-center py-4">No planning versions available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map(version => (
                    <TableRow 
                      key={version.id}
                      className={selectedVersionId === version.id ? 'bg-muted/50' : ''}
                    >
                      <TableCell>{version.name}</TableCell>
                      <TableCell>{version.year}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVersionSelect(version.id)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Selected Version Details */}
        {selectedVersion && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>
                {selectedVersion.name} ({selectedVersion.year})
              </CardTitle>
              <CardDescription>
                Manage quarter locks and fill with actual data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Lock Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="q1" 
                        checked={localLockState.q1}
                        onCheckedChange={(checked) => handleLockChange('q1', !!checked)}
                      />
                      <Label htmlFor="q1">Q1 Locked</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="q2" 
                        checked={localLockState.q2}
                        onCheckedChange={(checked) => handleLockChange('q2', !!checked)}
                      />
                      <Label htmlFor="q2">Q2 Locked</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="q3" 
                        checked={localLockState.q3}
                        onCheckedChange={(checked) => handleLockChange('q3', !!checked)}
                      />
                      <Label htmlFor="q3">Q3 Locked</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="q4" 
                        checked={localLockState.q4}
                        onCheckedChange={(checked) => handleLockChange('q4', !!checked)}
                      />
                      <Label htmlFor="q4">Q4 Locked</Label>
                    </div>
                  </div>
                  <Button 
                    className="mt-4"
                    onClick={handleSaveLocks}
                    disabled={isSavingLocks}
                  >
                    {isSavingLocks ? 'Saving...' : 'Save Lock Settings'}
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Fill with Actual Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will fill all locked quarters with actual timesheet data from {selectedVersion.year}.
                    Existing planning data for locked quarters will be replaced.
                  </p>
                  
                  <Dialog open={showFillActualDialog} onOpenChange={setShowFillActualDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Play className="mr-2 h-4 w-4" />
                        Fill Actual Hours
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Fill with Actual Hours</DialogTitle>
                        <DialogDescription>
                          This will fill all locked quarters with actual timesheet data.
                          Existing planning data for locked quarters will be replaced.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        <p className="font-medium">The following quarters will be filled:</p>
                        <ul className="list-disc ml-6 mt-2">
                          {localLockState.q1 && <li>Q1 (Jan-Mar)</li>}
                          {localLockState.q2 && <li>Q2 (Apr-Jun)</li>}
                          {localLockState.q3 && <li>Q3 (Jul-Sep)</li>}
                          {localLockState.q4 && <li>Q4 (Oct-Dec)</li>}
                          {!localLockState.q1 && !localLockState.q2 && !localLockState.q3 && !localLockState.q4 && 
                            <li className="text-muted-foreground">No quarters are locked</li>
                          }
                        </ul>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowFillActualDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleFillActual}
                          disabled={isFillingActual || (!localLockState.q1 && !localLockState.q2 && !localLockState.q3 && !localLockState.q4)}
                        >
                          {isFillingActual ? 'Processing...' : 'Fill Actual Hours'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
