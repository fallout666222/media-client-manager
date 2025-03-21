
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlanningGrid } from '@/components/Planning/PlanningGrid';
import { usePlanning } from '@/hooks/usePlanning';
import { useQuery } from '@tanstack/react-query';
import { getVisibleClients } from '@/integrations/supabase/database';
import { useApp } from '@/contexts/AppContext';

export default function Planning() {
  const { user, clients } = useApp();
  const {
    versions,
    versionsLoading,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
  } = usePlanning();
  
  // Get visible clients for current user
  const { data: visibleClientsData } = useQuery({
    queryKey: ['visible-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [] };
      return await getVisibleClients(user.id);
    },
    enabled: !!user?.id
  });
  
  // Extract visible client IDs
  const visibleClientIds = visibleClientsData?.data 
    ? visibleClientsData.data.map(vc => vc.client_id)
    : [];
  
  // Handle version selection change
  const handleVersionChange = (value: string) => {
    setSelectedVersionId(value);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 pt-16">
        <h1 className="text-2xl font-bold">Please log in to access Planning</h1>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Planning Version</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedVersionId || ''}
              onValueChange={handleVersionChange}
              disabled={versionsLoading || versions.length === 0}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a planning version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map(version => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.name} ({version.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user.role === 'admin' && (
              <Link to="/planning-management">
                <Button variant="outline">
                  Manage Planning Versions
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
      
      {versionsLoading && <div className="text-center py-4">Loading versions...</div>}
      
      {!versionsLoading && versions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="mb-4">No planning versions available.</p>
              {user.role === 'admin' && (
                <Link to="/planning-management">
                  <Button>
                    Create Planning Version
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedVersion && (
        <PlanningGrid
          currentUser={user}
          versionId={selectedVersion.id}
          clients={clients}
          visibleClientIds={visibleClientIds}
          isLocked={{
            q1: selectedVersion.q1_locked,
            q2: selectedVersion.q2_locked,
            q3: selectedVersion.q3_locked,
            q4: selectedVersion.q4_locked
          }}
        />
      )}
    </div>
  );
}
