
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client } from '@/types/timesheet';
import * as db from '@/integrations/supabase/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ClientTree: React.FC = () => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientParent, setNewClientParent] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients from database
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await db.getClients();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        });
        return [];
      }
      
      // Convert database fields to frontend format for compatibility
      return data?.map(client => ({
        ...client,
        parentId: client.parent_id,
        // Use the actual hidden field from the database now
        isDefault: false // Assuming no client is default by default
      })) || [];
    }
  });

  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (clientData: { name: string, parentId: string | null }) => {
      const { data, error } = await db.createClient({
        name: clientData.name,
        parent_id: clientData.parentId,
        hidden: false // New clients are not hidden by default
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setNewClientName('');
      setNewClientParent(null);
      
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Client> }) => {
      const { error } = await db.updateClient(id, data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.deleteClient(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  });

  const handleAddClient = () => {
    if (newClientName.trim() === '') {
      toast({
        title: "Error",
        description: "Client name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if client with this name already exists
    if (clients.some(client => client.name.toLowerCase() === newClientName.toLowerCase())) {
      toast({
        title: "Error",
        description: "A client with this name already exists",
        variant: "destructive",
      });
      return;
    }

    addClientMutation.mutate({
      name: newClientName.trim(),
      parentId: newClientParent
    });
  };

  const handleToggleHidden = (id: string, currentValue: boolean) => {
    // Now we're updating the actual hidden field, not deletion_mark
    updateClientMutation.mutate({
      id,
      data: { hidden: !currentValue }
    });
  };

  const handleUpdateParent = (id: string, parentId: string | null) => {
    // Prevent circular references
    if (parentId === id) {
      toast({
        title: "Error",
        description: "A client cannot be its own parent",
        variant: "destructive",
      });
      return;
    }

    // Check if this would create a circular reference in the hierarchy
    if (parentId && wouldCreateCircularReference(id, parentId)) {
      toast({
        title: "Error",
        description: "This would create a circular reference in the client hierarchy",
        variant: "destructive",
      });
      return;
    }

    updateClientMutation.mutate({
      id,
      data: { parent_id: parentId }
    });
  };

  // Function to check if setting a new parent would create a circular reference
  const wouldCreateCircularReference = (clientId: string, newParentId: string): boolean => {
    let currentParentId = newParentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected
      }
      
      if (currentParentId === clientId) {
        return true; // This would create a circle
      }
      
      visited.add(currentParentId);
      
      const parent = clients.find(c => c.id === currentParentId);
      if (!parent || !parent.parentId) {
        break;
      }
      
      currentParentId = parent.parentId;
    }
    
    return false;
  };

  const handleDeleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    
    if (client?.isDefault) {
      toast({
        title: "Cannot Delete",
        description: "Default clients cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this client has children
    if (clients.some(c => c.parentId === id)) {
      toast({
        title: "Cannot Delete",
        description: "This client has child clients. Please reassign or delete them first.",
        variant: "destructive",
      });
      return;
    }
    
    deleteClientMutation.mutate(id);
  };

  const getParentName = (parentId: string | null): string => {
    if (!parentId) return "None";
    const parent = clients.find(client => client.id === parentId);
    return parent ? parent.name : "Unknown";
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 pt-16">Loading clients...</div>;
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Client Tree Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Add New Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Client Name</label>
            <Input
              placeholder="Enter client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parent Client</label>
            <Select value={newClientParent || "none"} onValueChange={(value) => setNewClientParent(value === "none" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddClient} 
            className="flex items-center gap-2"
            disabled={addClientMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Client Hierarchy</h2>
        <Table>
          <TableCaption>Manage your client hierarchy and visibility</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Parent Client</TableHead>
              <TableHead>Hide from Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className={client.isDefault ? "bg-muted/30" : ""}>
                <TableCell className="font-medium">
                  {client.name}
                  {client.isDefault && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Default
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Select 
                    value={client.parentId || "none"} 
                    onValueChange={(value) => handleUpdateParent(client.id, value === "none" ? null : value)}
                    disabled={client.isDefault || updateClientMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients
                        .filter(c => c.id !== client.id) // Can't be its own parent
                        .map((parentClient) => (
                          <SelectItem key={parentClient.id} value={parentClient.id}>
                            {parentClient.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Checkbox 
                      id={`hide-${client.id}`}
                      checked={client.hidden}
                      onCheckedChange={() => handleToggleHidden(client.id, client.hidden)}
                      disabled={updateClientMutation.isPending}
                    />
                    <label
                      htmlFor={`hide-${client.id}`}
                      className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Hide
                    </label>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {client.isDefault ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled
                      className="text-muted-foreground"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                      disabled={deleteClientMutation.isPending}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientTree;
