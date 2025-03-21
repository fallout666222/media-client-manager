
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientSelector } from "@/components/ClientSelector";
import { useAddClient } from '@/hooks/useClientOperations';
import { Client } from '@/types/timesheet';

interface AddClientFormProps {
  clients: Client[];
}

export const AddClientForm: React.FC<AddClientFormProps> = ({ clients }) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientParent, setNewClientParent] = useState<string | null>(null);
  const [parentSearchValue, setParentSearchValue] = useState('');
  const { toast } = useToast();
  const addClientMutation = useAddClient();

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
    
    // Check if client name is in DEFAULT_SYSTEM_CLIENTS
    const DEFAULT_SYSTEM_CLIENTS = [
      "Administrative",
      "Education/Training",
      "General Research",
      "Network Requests",
      "New Business",
      "Sick Leave",
      "VACATION"
    ];
    
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
    }, {
      onSuccess: () => {
        setNewClientName('');
        setNewClientParent(null);
        setParentSearchValue('');
      }
    });
  };

  const handleParentSelect = (client: Client | null) => {
    setNewClientParent(client?.id || null);
  };

  return (
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
          <ClientSelector
            clients={clients}
            selectedClient={clients.find(c => c.id === newClientParent) || null}
            onClientSelect={handleParentSelect}
            searchValue={parentSearchValue}
            onSearchChange={setParentSearchValue}
            placeholder="Select parent client (optional)"
            showNoResultsMessage={true}
            clearSearchOnSelect={true}
            autoOpenOnFocus={true}
          />
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
  );
};
