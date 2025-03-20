
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/types/timesheet';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { SearchableList } from './SearchableList';
import { SortableItemsList } from './SortableItemsList';
import { DEFAULT_SYSTEM_CLIENTS } from './constants';
import * as db from "@/integrations/supabase/database";

interface ClientSettingsProps {
  clients: string[];
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  selectedClients: string[];
  onSelectClient: (client: string) => void;
  onReorderClients?: (clients: string[]) => void;
  visibleClients?: Client[];
  currentUserId?: string;
  onSelectSystemClient?: (systemClientName: string) => void; // Add this prop
}

export const ClientSettings: React.FC<ClientSettingsProps> = ({
  onAddClient,
  onRemoveClient,
  userRole,
  availableClients,
  selectedClients,
  onSelectClient,
  onReorderClients,
  visibleClients = [],
  currentUserId,
  onSelectSystemClient, // Add this prop
}) => {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClientsToAdd, setSelectedClientsToAdd] = useState<string[]>([]);
  const { toast } = useToast();
  
  const filteredAvailableClients = userRole === 'admin' 
    ? availableClients 
    : visibleClients.filter(client => !client.hidden).map(client => client.name);

  const sortedAvailableClients = [...filteredAvailableClients].sort((a, b) => {
    const aIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(a);
    const bIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(b);
    
    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;
    
    if (aIsDefault && bIsDefault) {
      return DEFAULT_SYSTEM_CLIENTS.indexOf(a) - DEFAULT_SYSTEM_CLIENTS.indexOf(b);
    }
    
    return a.localeCompare(b);
  });

  const filteredClients = sortedAvailableClients
    .filter(client => !selectedClients.includes(client))
    .filter(client => 
      client.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

  const handleToggleClientSelection = (client: string, checked: boolean) => {
    if (checked) {
      setSelectedClientsToAdd(prev => [...prev, client]);
    } else {
      setSelectedClientsToAdd(prev => prev.filter(c => c !== client));
    }
  };

  const handleSelectMultipleClients = () => {
    if (selectedClientsToAdd.length > 0) {
      const systemClientsToAdd = selectedClientsToAdd.filter(client => 
        DEFAULT_SYSTEM_CLIENTS.includes(client)
      );
      
      // First add all selected clients
      selectedClientsToAdd.forEach(client => {
        if (!selectedClients.includes(client)) {
          onSelectClient(client);
        }
      });
      
      // Then check if we need to add Administrative media type
      if (systemClientsToAdd.length > 0 && onSelectSystemClient) {
        // Let the parent component know that a system client was added
        // so it can add the Administrative media type
        onSelectSystemClient(systemClientsToAdd[0]);
      }

      setSelectedClientsToAdd([]);
      setClientSearchTerm('');
      toast({
        title: "Clients Added",
        description: `Added ${selectedClientsToAdd.length} clients to your visible clients`,
      });
    }
  };

  const handleReorderClients = async (newOrder: string[]) => {
    if (onReorderClients) {
      onReorderClients(newOrder);
    }
    
    if (currentUserId) {
      try {
        await db.updateVisibleClientsOrder(currentUserId, newOrder);
        console.log('Client order updated in database');
      } catch (error) {
        console.error('Error updating client order:', error);
        toast({
          title: "Error",
          description: "Failed to save client order",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Your Visible Clients</h3>
      
      {filteredClients.length === 0 && selectedClients.length === 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No clients are available. Please contact your administrator to add clients.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="client-select">Select clients to add</Label>
          <SearchableList
            items={filteredClients}
            searchTerm={clientSearchTerm}
            selectedItems={selectedClientsToAdd}
            onSearchChange={setClientSearchTerm}
            onToggleSelection={handleToggleClientSelection}
            onAddSelected={handleSelectMultipleClients}
            emptyMessage="No matching clients found"
            noResultsMessage="No clients available"
            addButtonText="Add Selected Clients"
            isSystemItem={(client) => DEFAULT_SYSTEM_CLIENTS.includes(client)}
          />
        </div>
      </div>
      
      <div className="mb-8">
        <div className="mb-2 text-sm text-muted-foreground">
          Drag items to reorder. Items at the top of the list will appear first in your timesheet.
        </div>
        
        <SortableItemsList
          items={selectedClients}
          onReorder={handleReorderClients}
          onRemoveItem={onRemoveClient}
          emptyMessage="No clients selected. Please select clients from the list above."
          isSystemItem={(client) => DEFAULT_SYSTEM_CLIENTS.includes(client)}
        />
      </div>
    </div>
  );
};
