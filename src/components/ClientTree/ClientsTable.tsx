
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, ChevronUp, ChevronDown } from "lucide-react";
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
import { useUpdateClient, useCheckCircularReference } from '@/hooks/useClientOperations';
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_SYSTEM_CLIENTS } from './constants';

interface SortConfig {
  key: 'name' | 'parentName' | 'hidden';
  direction: 'asc' | 'desc';
}

interface ClientsTableProps {
  clients: Client[];
  paginatedClients: Client[];
  onSort: (config: SortConfig) => void;
  sortConfig: SortConfig | null;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ 
  clients, 
  paginatedClients,
  onSort,
  sortConfig
}) => {
  const updateClientMutation = useUpdateClient();
  const wouldCreateCircularReference = useCheckCircularReference();
  const { toast } = useToast();
  
  const handleSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    onSort({ key, direction });
  };

  const renderSortIcon = (key: SortConfig['key']) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <div className="w-4 h-4 inline-block ml-1" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 inline-block ml-1" /> 
      : <ChevronDown className="w-4 h-4 inline-block ml-1" />;
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

  return (
    <Table>
      <TableCaption>Manage your client hierarchy and visibility</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead 
            className="cursor-pointer"
            onClick={() => handleSort('name')}
          >
            Client Name {renderSortIcon('name')}
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => handleSort('parentName')}
          >
            Parent Client {renderSortIcon('parentName')}
          </TableHead>
          <TableHead 
            className="cursor-pointer"
            onClick={() => handleSort('hidden')}
          >
            Hide from Users {renderSortIcon('hidden')}
          </TableHead>
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
