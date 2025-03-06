import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Client } from '@/types/timesheet';

interface SettingsProps {
  clients: string[];
  mediaTypes: string[];
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  selectedClients: string[];
  selectedMediaTypes: string[];
  onSelectClient: (client: string) => void;
  onSelectMediaType: (type: string) => void;
  visibleClients?: Client[]; // This prop receives the filtered client list
}

export const Settings = ({
  clients,
  mediaTypes,
  onAddClient,
  onRemoveClient,
  onAddMediaType,
  onRemoveMediaType,
  userRole,
  availableClients,
  availableMediaTypes,
  selectedClients,
  selectedMediaTypes,
  onSelectClient,
  onSelectMediaType,
  visibleClients = [], // Default to empty array
}: SettingsProps) => {
  const [newClient, setNewClient] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const [selectedClientToAdd, setSelectedClientToAdd] = useState('');
  const [selectedMediaTypeToAdd, setSelectedMediaTypeToAdd] = useState('');
  const { toast } = useToast();

  const isAdmin = userRole === 'admin';

  // For admin users, show all clients; for regular users, filter out those marked as hidden
  const filteredAvailableClients = isAdmin 
    ? availableClients 
    : availableClients.filter(clientName => {
        // Find the client object that matches this name
        const clientObject = visibleClients.find(c => c.name === clientName);
        // Only include clients that aren't marked as hidden
        return clientObject && !clientObject.hidden;
      });

  const handleAddClient = () => {
    if (!newClient.trim()) {
      toast({
        title: "Error",
        description: "Client name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    onAddClient(newClient.trim());
    setNewClient('');
  };

  const handleAddMediaType = () => {
    if (!newMediaType.trim()) {
      toast({
        title: "Error",
        description: "Media type cannot be empty",
        variant: "destructive",
      });
      return;
    }
    onAddMediaType(newMediaType.trim());
    setNewMediaType('');
  };

  const handleSelectClient = () => {
    if (selectedClientToAdd && !selectedClients.includes(selectedClientToAdd)) {
      onSelectClient(selectedClientToAdd);
      setSelectedClientToAdd('');
    }
  };

  const handleSelectMediaType = () => {
    if (selectedMediaTypeToAdd && !selectedMediaTypes.includes(selectedMediaTypeToAdd)) {
      onSelectMediaType(selectedMediaTypeToAdd);
      setSelectedMediaTypeToAdd('');
    }
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <>
          <div>
            <h3 className="text-lg font-medium mb-4">Manage Clients (Admin)</h3>
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 w-full">
                <p className="font-bold">Client Management Moved</p>
                <p>Client management has been moved to the dedicated Client Tree page. Please use that page to add, edit, or remove clients.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Manage Media Types (Admin)</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add new media type"
                value={newMediaType}
                onChange={(e) => setNewMediaType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMediaType()}
              />
              <Button onClick={handleAddMediaType}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                >
                  <span>{type}</span>
                  <button
                    onClick={() => onRemoveMediaType(type)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4">Your Visible Clients</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="client-select">Select client to add</Label>
            <div className="flex gap-2 mt-1">
              <Select value={selectedClientToAdd} onValueChange={setSelectedClientToAdd}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableClients
                    .filter(client => !selectedClients.includes(client))
                    .map(client => (
                      <SelectItem key={client} value={client}>{client}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSelectClient} disabled={!selectedClientToAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {selectedClients.map((client) => (
            <div
              key={client}
              className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
            >
              <span>{client}</span>
              <button
                onClick={() => onRemoveClient(client)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Your Visible Media Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="media-select">Select media type to add</Label>
            <div className="flex gap-2 mt-1">
              <Select value={selectedMediaTypeToAdd} onValueChange={setSelectedMediaTypeToAdd}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  {availableMediaTypes
                    .filter(type => !selectedMediaTypes.includes(type))
                    .map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSelectMediaType} disabled={!selectedMediaTypeToAdd}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedMediaTypes.map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
            >
              <span>{type}</span>
              <button
                onClick={() => onRemoveMediaType(type)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
