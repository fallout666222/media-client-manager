import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ArrowLeft, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SearchBar from "@/components/SearchBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Client } from '@/types/timesheet';
import * as db from '@/integrations/supabase/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DEFAULT_SYSTEM_CLIENTS = [
  "Administrative",
  "Education/Training",
  "General Research",
  "Network Requests",
  "New Business",
  "Sick Leave",
  "VACATION"
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const ClientTree: React.FC = () => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientParent, setNewClientParent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      
      return data?.map(client => ({
        ...client,
        parentId: client.parent_id,
        isDefault: DEFAULT_SYSTEM_CLIENTS.includes(client.name)
      })) || [];
    }
  });

  const addClientMutation = useMutation({
    mutationFn: async (clientData: { name: string, parentId: string | null }) => {
      const { data, error } = await db.createClient({
        name: clientData.name,
        parent_id: clientData.parentId,
        hidden: false
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

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Client> }) => {
      const client = clients.find(c => c.id === id);
      if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
        throw new Error("Cannot modify system default clients");
      }
      
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

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = clients.find(c => c.id === id);
      
      if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
        throw new Error("Cannot delete system default clients");
      }
      
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

  useEffect(() => {
    const ensureDefaultClients = async () => {
      if (!clients.length) return;
      
      const missingClients = DEFAULT_SYSTEM_CLIENTS.filter(
        defaultClient => !clients.some(client => client.name === defaultClient)
      );
      
      for (const clientName of missingClients) {
        try {
          await db.createClient({
            name: clientName,
            hidden: false
          });
          console.log(`Created default client: ${clientName}`);
        } catch (error) {
          console.error(`Failed to create default client ${clientName}:`, error);
        }
      }
      
      if (missingClients.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    };
    
    ensureDefaultClients();
  }, [clients, queryClient]);

  const handleAddClient = () => {
    if (newClientName.trim() === '') {
      toast({
        title: "Error",
        description: "Client name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (clients.some(client => client.name.toLowerCase() === newClientName.toLowerCase())) {
      toast({
        title: "Error",
        description: "A client with this name already exists",
        variant: "destructive",
      });
      return;
    }
    
    if (DEFAULT_SYSTEM_CLIENTS.includes(newClientName.trim())) {
      toast({
        title: "Error",
        description: "This client is a system default and already exists",
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
    const client = clients.find(c => c.id === id);
    
    if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
      toast({
        title: "Error",
        description: "System default clients cannot be hidden",
        variant: "destructive",
      });
      return;
    }
    
    updateClientMutation.mutate({
      id,
      data: { hidden: !currentValue }
    });
  };

  const handleUpdateParent = (id: string, parentId: string | null) => {
    const client = clients.find(c => c.id === id);
    
    if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
      toast({
        title: "Error",
        description: "System default clients cannot be modified",
        variant: "destructive",
      });
      return;
    }
    
    if (parentId === id) {
      toast({
        title: "Error",
        description: "A client cannot be its own parent",
        variant: "destructive",
      });
      return;
    }

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

  const wouldCreateCircularReference = (clientId: string, newParentId: string): boolean => {
    let currentParentId = newParentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true;
      }
      
      if (currentParentId === clientId) {
        return true;
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
    
    if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
      toast({
        title: "Cannot Delete",
        description: "System default clients cannot be deleted",
        variant: "destructive",
      });
      return;
    }
    
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search clients..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            {paginatedClients.map((client) => (
              <TableRow key={client.id} className={client.isDefault ? "bg-muted/30" : ""}>
                <TableCell className="font-medium">
                  {client.name}
                  {client.isDefault && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      System Default
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
                        .filter(c => c.id !== client.id)
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
                      disabled={client.isDefault || updateClientMutation.isPending}
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

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTree;
