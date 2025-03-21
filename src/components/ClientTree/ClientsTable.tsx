
import React from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Lock } from "lucide-react";
import { Client } from '@/types/timesheet';
import { ClientSelector } from "@/components/ClientSelector";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUpdateClient, useDeleteClient, useCheckCircularReference } from '@/hooks/useClientOperations';
import { useToast } from "@/hooks/use-toast";

interface ClientsTableProps {
  clients: Client[];
  paginatedClients: Client[];
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, paginatedClients }) => {
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();
  const wouldCreateCircularReference = useCheckCircularReference();
  const { toast } = useToast();
  
  const DEFAULT_SYSTEM_CLIENTS = [
    "Administrative",
    "Education/Training",
    "General Research",
    "Network Requests",
    "New Business", 
    "Sick Leave",
    "VACATION"
  ];

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

    if (parentId && wouldCreateCircularReference(clients, id, parentId)) {
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

  return (
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
        {paginatedClients.map((client) => {
          const isDefault = DEFAULT_SYSTEM_CLIENTS.includes(client.name);
          return (
            <TableRow key={client.id} className={isDefault ? "bg-muted/30" : ""}>
              <TableCell className="font-medium">
                {client.name}
                {isDefault && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    System Default
                  </span>
                )}
              </TableCell>
              <TableCell>
                <ClientSelector
                  clients={clients.filter(c => c.id !== client.id)}
                  selectedClient={clients.find(c => c.id === client.parentId) || null}
                  onClientSelect={(selectedClient) => handleUpdateParent(client.id, selectedClient?.id || null)}
                  disabled={isDefault || updateClientMutation.isPending}
                  placeholder="None"
                  showNoResultsMessage={true}
                  clearSearchOnSelect={true}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Checkbox 
                    id={`hide-${client.id}`}
                    checked={client.hidden}
                    onCheckedChange={() => handleToggleHidden(client.id, client.hidden)}
                    disabled={isDefault || updateClientMutation.isPending}
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
                {isDefault ? (
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
          );
        })}
      </TableBody>
    </Table>
  );
};
