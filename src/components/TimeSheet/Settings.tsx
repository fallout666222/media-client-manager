import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsProps {
  clients: string[];
  mediaTypes: string[];
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
}

export const Settings = ({
  clients,
  mediaTypes,
  onAddClient,
  onRemoveClient,
  onAddMediaType,
  onRemoveMediaType,
}: SettingsProps) => {
  const [newClient, setNewClient] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const { toast } = useToast();

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

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Clients</h3>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Add new client"
            value={newClient}
            onChange={(e) => setNewClient(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddClient()}
          />
          <Button onClick={handleAddClient}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {clients.map((client) => (
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
        <h3 className="text-lg font-medium mb-4">Media Types</h3>
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
    </div>
  );
};