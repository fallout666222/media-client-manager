
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Info, Search } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableItem } from './SortableItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  clients?: string[];
  mediaTypes?: string[];
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
  onReorderClients?: (clients: string[]) => void;
  onReorderMediaTypes?: (types: string[]) => void;
  currentUserId?: string;
  onSaveClients: (clients: string[]) => void;
  onSaveMediaTypes: (types: string[]) => void;
  readOnly?: boolean;
  isViewingOwnTimesheet?: boolean;
  clientObjects?: Client[];
  adminOverride?: boolean;
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
  onReorderClients,
  onReorderMediaTypes,
  currentUserId,
  onSaveClients,
  onSaveMediaTypes,
  readOnly = false,
  isViewingOwnTimesheet = true,
  clientObjects = [],
  adminOverride = false,
}: SettingsProps) => {
  const [newClient, setNewClient] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const [selectedClientToAdd, setSelectedClientToAdd] = useState('');
  const [selectedClientsToAdd, setSelectedClientsToAdd] = useState<string[]>([]);
  const [selectedMediaTypeToAdd, setSelectedMediaTypeToAdd] = useState('');
  const [selectedMediaTypesToAdd, setSelectedMediaTypesToAdd] = useState<string[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [mediaTypeSearchTerm, setMediaTypeSearchTerm] = useState('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Filter out hidden clients for non-admin users
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

  const filteredClients = sortedAvailableClients
    .filter(client => !selectedClients.includes(client))
    .filter(client => 
      client.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

  const mediaTypeOptions = allMediaTypes.map(type => type.name);
  const filteredMediaTypes = mediaTypeOptions
    .filter(type => !selectedMediaTypes.includes(type))
    .filter(type => 
      type.toLowerCase().includes(mediaTypeSearchTerm.toLowerCase())
    );

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

  const handleSelectMultipleClients = () => {
    if (selectedClientsToAdd.length > 0) {
      selectedClientsToAdd.forEach(client => {
        if (!selectedClients.includes(client)) {
          onSelectClient(client);
        }
      });
      setSelectedClientsToAdd([]);
      setClientSearchTerm('');
      toast({
        title: "Clients Added",
        description: `Added ${selectedClientsToAdd.length} clients to your visible clients`,
      });
    }
  };

  const handleToggleClientSelection = (client: string, checked: boolean) => {
    if (checked) {
      setSelectedClientsToAdd(prev => [...prev, client]);
    } else {
      setSelectedClientsToAdd(prev => prev.filter(c => c !== client));
    }
  };

  const handleSelectMediaType = () => {
    if (selectedMediaTypeToAdd && !selectedMediaTypes.includes(selectedMediaTypeToAdd)) {
      onSelectMediaType(selectedMediaTypeToAdd);
      setSelectedMediaTypeToAdd('');
    }
  };

  const handleSelectMultipleMediaTypes = () => {
    if (selectedMediaTypesToAdd.length > 0) {
      selectedMediaTypesToAdd.forEach(type => {
        if (!selectedMediaTypes.includes(type)) {
          onSelectMediaType(type);
        }
      });
      setSelectedMediaTypesToAdd([]);
      setMediaTypeSearchTerm('');
      toast({
        title: "Media Types Added",
        description: `Added ${selectedMediaTypesToAdd.length} media types to your visible media types`,
      });
    }
  };

  const handleToggleMediaTypeSelection = (mediaType: string, checked: boolean) => {
    if (checked) {
      setSelectedMediaTypesToAdd(prev => [...prev, mediaType]);
    } else {
      setSelectedMediaTypesToAdd(prev => prev.filter(t => t !== mediaType));
    }
  };

  const handleDragEndClients = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedClients.indexOf(active.id as string);
      const newIndex = selectedClients.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(selectedClients, oldIndex, newIndex);
        
        // Update the order in the UI through parent component
        if (onReorderClients) {
          onReorderClients(newOrder);
        }
        
        // Update order in the database directly
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
      }
    }
  };

  const handleDragEndMediaTypes = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedMediaTypes.indexOf(active.id as string);
      const newIndex = selectedMediaTypes.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(selectedMediaTypes, oldIndex, newIndex);
        
        // Update the order in the UI through parent component
        if (onReorderMediaTypes) {
          onReorderMediaTypes(newOrder);
        }
        
        // Update order in the database directly
        if (currentUserId) {
          try {
            await db.updateVisibleTypesOrder(currentUserId, newOrder);
            console.log('Media type order updated in database');
          } catch (error) {
            console.error('Error updating media type order:', error);
            toast({
              title: "Error",
              description: "Failed to save media type order",
              variant: "destructive",
            });
          }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
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
            <div className="flex flex-col gap-2 mt-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-48 border rounded-md p-2">
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No matching clients found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredClients.map(client => (
                      <div key={client} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`client-${client}`} 
                          checked={selectedClientsToAdd.includes(client)}
                          onCheckedChange={(checked) => handleToggleClientSelection(client, checked === true)}
                        />
                        <label htmlFor={`client-${client}`} className="text-sm flex-1 cursor-pointer">
                          {client}
                          {DEFAULT_SYSTEM_CLIENTS.includes(client) && (
                            <span className="ml-2 text-xs font-medium text-blue-600">(System)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Button 
                onClick={handleSelectMultipleClients} 
                disabled={selectedClientsToAdd.length === 0}
                className="w-full"
              >
                Add {selectedClientsToAdd.length > 0 ? `Selected Clients (${selectedClientsToAdd.length})` : 'Clients'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="mb-2 text-sm text-muted-foreground">
            Drag items to reorder. Items at the top of the list will appear first in your timesheet.
          </div>
          {selectedClients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clients selected. Please select clients from the list above.</p>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndClients}
            >
              <SortableContext 
                items={selectedClients} 
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-2">
                  {selectedClients.map((client) => (
                    <SortableItem
                      key={client}
                      id={client}
                      onRemove={() => onRemoveClient(client)}
                      isSystemItem={DEFAULT_SYSTEM_CLIENTS.includes(client)}
                    >
                      {client}
                      {DEFAULT_SYSTEM_CLIENTS.includes(client) && (
                        <span className="ml-1 text-xs font-medium">(System)</span>
                      )}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
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
        
        {filteredMediaTypes.length === 0 && selectedMediaTypes.length === 0 && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No media types are available. Please contact your administrator to add media types.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="media-select">Select media types to add</Label>
            <div className="flex flex-col gap-2 mt-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media types..."
                  value={mediaTypeSearchTerm}
                  onChange={(e) => setMediaTypeSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-48 border rounded-md p-2">
                {filteredMediaTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No matching media types found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredMediaTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`media-type-${type}`} 
                          checked={selectedMediaTypesToAdd.includes(type)}
                          onCheckedChange={(checked) => handleToggleMediaTypeSelection(type, checked === true)}
                        />
                        <label htmlFor={`media-type-${type}`} className="text-sm flex-1 cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Button 
                onClick={handleSelectMultipleMediaTypes} 
                disabled={selectedMediaTypesToAdd.length === 0 || isLoadingMediaTypes}
                className="w-full"
              >
                Add {selectedMediaTypesToAdd.length > 0 ? `Selected Media Types (${selectedMediaTypesToAdd.length})` : 'Media Types'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mb-2 text-sm text-muted-foreground">
          Drag items to reorder. Items at the top of the list will appear first in your timesheet.
        </div>
        
        {selectedMediaTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media types selected. Please select media types from the list above.</p>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndMediaTypes}
          >
            <SortableContext 
              items={selectedMediaTypes} 
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-2">
                {selectedMediaTypes.map((type) => (
                  <SortableItem
                    key={type}
                    id={type}
                    onRemove={() => onRemoveMediaType(type)}
                  >
                    {type}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
