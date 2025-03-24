
import React, { useState, useEffect } from 'react';
import { User, Client } from '@/types/timesheet';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateVersionStatus } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import Planning from './Planning';
import { fetchUserVersionsForApproval } from '@/pages/api/userVersionsForApproval';
import { fetchStatusId } from '@/pages/api/statusId';

interface UserHeadViewProps {
  currentUser: User;
  clients: Client[];
}

export default function UserHeadView({ currentUser, clients }: UserHeadViewProps) {
  const [activeTab, setActiveTab] = useState<string>('timesheet');
  const { toast } = useToast();
  const [userVersionsForApproval, setUserVersionsForApproval] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchVersions = async () => {
      if (currentUser.id) {
        try {
          const result = await fetchUserVersionsForApproval(currentUser.id);
          
          if (result.error) throw result.error;
          
          if (result.data) {
            setUserVersionsForApproval(result.data);
          }
        } catch (error) {
          console.error('Error fetching versions for approval:', error);
        }
      }
    };
    
    fetchVersions();
  }, [currentUser.id, refreshTrigger]);

  const handleApprove = async (versionId: string, userId: string) => {
    try {
      // Get the 'accepted' status ID directly from Supabase
      const statusResult = await fetchStatusId('accepted');
      
      if (statusResult.error) {
        throw new Error('Could not find accepted status');
      }
      
      const statusId = statusResult.data?.id;
      if (!statusId) throw new Error('Could not find accepted status');

      await updateVersionStatus(userId, versionId, statusId);
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: 'Version Approved',
        description: 'Planning version has been approved',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error approving version:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve version',
        variant: 'destructive'
      });
    }
  };
  
  const handleRequestRevision = async (versionId: string, userId: string) => {
    try {
      // Get the 'needs-revision' status ID directly from Supabase
      const statusResult = await fetchStatusId('needs-revision');
      
      if (statusResult.error) {
        throw new Error('Could not find needs-revision status');
      }
      
      const statusId = statusResult.data?.id;
      if (!statusId) throw new Error('Could not find needs-revision status');

      await updateVersionStatus(userId, versionId, statusId);
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: 'Revision Requested',
        description: 'User will need to revise the planning version',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast({
        title: 'Error',
        description: 'Failed to request revision',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'unconfirmed':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'under-review':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'needs-revision':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Head View</h1>
        <Link to="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timesheet">Timesheet Approvals</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timesheet">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Timesheet Approvals</CardTitle>
                <CardDescription>
                  Review and approve timesheets for team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Your existing timesheet approval content here */}
                <div>Timesheet approval content goes here</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="planning">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Planning Approvals</CardTitle>
                <CardDescription>
                  Review and approve planning versions for team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userVersionsForApproval.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userVersionsForApproval.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.user?.name}</TableCell>
                          <TableCell>{item.version?.name}</TableCell>
                          <TableCell>{item.version?.year}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(item.status?.name)}>
                              {item.status?.name === 'under-review' ? 'Under Review' : 
                               item.status?.name === 'needs-revision' ? 'Needs Revision' : 
                               item.status?.name?.charAt(0).toUpperCase() + item.status?.name?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.status?.name === 'under-review' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  onClick={() => handleApprove(item.version_id, item.user_id)}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleRequestRevision(item.version_id, item.user_id)}
                                >
                                  Request Revision
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No planning versions awaiting approval
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Planning</CardTitle>
                <CardDescription>
                  Manage your own planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Planning currentUser={currentUser} clients={clients} isUserHead={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
