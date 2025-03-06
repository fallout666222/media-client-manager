import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import * as db from "@/integrations/supabase/database";

const DEFAULT_SYSTEM_CLIENTS = [
  "Administrative",
  "Education/Training",
  "General Research",
  "Network Requests",
  "New Business",
  "Sick Leave",
  "VACATION"
];

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
  visibleClients?: Client[];
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
  visibleClients = [],
}: SettingsProps) => {
  const [newClient, setNewClient] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const [selectedClientToAdd, setSelectedClientToAdd] = useState('');
  const [selectedMediaTypeToAdd, setSelectedMediaTypeToAdd] = useState('');
  const { toast } = useToast();

  const isAdmin = userRole === 'admin';

  const { data: allMediaTypes = [], isLoading: isLoadingMediaTypes } = useQuery({
    queryKey: ['mediaTypes'],
    queryFn: async () => {
      const { data, error } = await db.getMediaTypes();
      
      if (error) {
        console.error("Error fetching media types:", error);
        toast({
          title: "Error",
          description: "Failed to load media types",
          variant: "destructive",
        });
        throw error;
      }
      
      return data || [];
    },
    enabled: true,
  });

  const filteredAvailableClients = isAdmin 
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

  const mediaTypeOptions = allMediaTypes.map(type => type.name);

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

  const sortedSelectedClients = [...selectedClients].sort((a, b) => {
    const aIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(a);
    const bIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(b);
    
    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;
    
    if (aIsDefault && bIsDefault) {
      return DEFAULT_SYSTEM_CLIENTS.indexOf(a) - DEFAULT_SYSTEM_CLIENTS.indexOf(b);
    }
    
    return a.localeCompare(b);
  });

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
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 w-full">
                <p className="font-bold">Media Type Management Moved</p>
                <p>Media type management has been moved to the dedicated Media Types page. Please use that page to add or view media types.</p>
              </div>
            </div>
            {isLoadingMediaTypes ? (
              <div className="text-center py-2">Loading media types...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allMediaTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
                  >
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>
            )}
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
                  {sortedAvailableClients
                    .filter(client => !selectedClients.includes(client))
                    .map(client => (
                      <SelectItem key={client} value={client}>
                        {client}
                        {DEFAULT_SYSTEM_CLIENTS.includes(client) && (
                          <span className="ml-2 text-xs font-medium text-blue-600">(System)</span>
                        )}
                      </SelectItem>
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
          {sortedSelectedClients.map((client) => (
            <div
              key={client}
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                DEFAULT_SYSTEM_CLIENTS.includes(client) 
                  ? "bg-blue-100 text-blue-900" 
                  : "bg-secondary"
              }`}
            >
              <span>
                {client}
                {DEFAULT_SYSTEM_CLIENTS.includes(client) && (
                  <span className="ml-1 text-xs font-medium">(System)</span>
                )}
              </span>
              {!DEFAULT_SYSTEM_CLIENTS.includes(client) && (
                <button
                  onClick={() => onRemoveClient(client)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
          Your Visible Media Types
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select which media types to display in your timesheet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="media-select">Select media type to add</Label>
            <div className="flex gap-2 mt-1">
              <Select value={selectedMediaTypeToAdd} onValueChange={setSelectedMediaTypeToAdd}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingMediaTypes ? (
                    <SelectItem value="loading" disabled>Loading media types...</SelectItem>
                  ) : (
                    mediaTypeOptions
                      .filter(type => !selectedMediaTypes.includes(type))
                      .map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleSelectMediaType} disabled={!selectedMediaTypeToAdd || isLoadingMediaTypes}>
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
