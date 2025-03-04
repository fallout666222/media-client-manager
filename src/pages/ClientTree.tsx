
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, ArrowLeft } from "lucide-react";
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

interface ClientTreeProps {
  clients: Client[];
  onAddClient: (clientData: Omit<Client, "id">) => void;
  onUpdateClient: (id: string, clientData: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
}

const ClientTree: React.FC<ClientTreeProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient
}) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientParent, setNewClientParent] = useState<string | null>(null);
  const { toast } = useToast();

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

    onAddClient({
      name: newClientName.trim(),
      parentId: newClientParent,
      hidden: false
    });

    setNewClientName('');
    setNewClientParent(null);
    
    toast({
      title: "Success",
      description: "Client added successfully",
    });
  };

  const handleToggleHidden = (id: string, currentValue: boolean) => {
    onUpdateClient(id, { hidden: !currentValue });
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

    onUpdateClient(id, { parentId });
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
    // Check if this client has children
    const hasChildren = clients.some(client => client.parentId === id);
    
    if (hasChildren) {
      toast({
        title: "Cannot Delete",
        description: "This client has child clients. Please reassign or delete them first.",
        variant: "destructive",
      });
      return;
    }
    
    onDeleteClient(id);
    
    toast({
      title: "Client Deleted",
      description: "Client has been removed",
    });
  };

  const getParentName = (parentId: string | null): string => {
    if (!parentId) return "None";
    const parent = clients.find(client => client.id === parentId);
    return parent ? parent.name : "Unknown";
  };

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
            <Select value={newClientParent || ""} onValueChange={(value) => setNewClientParent(value || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent client (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddClient} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Client
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
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  <Select 
                    value={client.parentId || ""} 
                    onValueChange={(value) => handleUpdateParent(client.id, value || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
