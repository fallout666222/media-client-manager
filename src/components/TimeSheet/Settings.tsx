import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SettingsProps {
  clients: string[];
  mediaTypes: string[];
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
  userRole: string;
}

export const Settings = ({
  clients,
  mediaTypes,
  onAddClient,
  onRemoveClient,
  onAddMediaType,
  onRemoveMediaType,
  userRole,
}: SettingsProps) => {
  const [newClient, setNewClient] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [openClient, setOpenClient] = useState(false);
  const [openMediaType, setOpenMediaType] = useState(false);
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

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Clients</h3>
        {isAdmin ? (
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
        ) : (
          <Popover open={openClient} onOpenChange={setOpenClient}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openClient}
                className="w-full justify-between"
              >
                {selectedClient || "Select client..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border rounded-md shadow-md">
              <Command>
                <CommandInput placeholder="Search client..." className="border-0" />
                <CommandEmpty>No client found.</CommandEmpty>
                <CommandGroup>
                  {clients.map((client) => (
                    <CommandItem
                      key={client}
                      onSelect={() => {
                        setSelectedClient(client);
                        setOpenClient(false);
                      }}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {client}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <div className="flex flex-wrap gap-2">
          {clients.map((client) => (
            <div
              key={client}
              className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
            >
              <span>{client}</span>
              {isAdmin && (
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
        <h3 className="text-lg font-medium mb-4">Media Types</h3>
        {isAdmin ? (
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
        ) : (
          <Popover open={openMediaType} onOpenChange={setOpenMediaType}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openMediaType}
                className="w-full justify-between"
              >
                {selectedMediaType || "Select media type..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white border rounded-md shadow-md">
              <Command>
                <CommandInput placeholder="Search media type..." className="border-0" />
                <CommandEmpty>No media type found.</CommandEmpty>
                <CommandGroup>
                  {mediaTypes.map((type) => (
                    <CommandItem
                      key={type}
                      onSelect={() => {
                        setSelectedMediaType(type);
                        setOpenMediaType(false);
                      }}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        <div className="flex flex-wrap gap-2">
          {mediaTypes.map((type) => (
            <div
              key={type}
              className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full"
            >
              <span>{type}</span>
              {isAdmin && (
                <button
                  onClick={() => onRemoveMediaType(type)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};