
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchableList } from './SearchableList';
import { SortableItemsList } from './SortableItemsList';
import * as db from "@/integrations/supabase/database";

interface MediaTypeSettingsProps {
  mediaTypes: string[];
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
  availableMediaTypes: string[];
  selectedMediaTypes: string[];
  onSelectMediaType: (type: string) => void;
  onReorderMediaTypes?: (types: string[]) => void;
  currentUserId?: string;
}

export const MediaTypeSettings: React.FC<MediaTypeSettingsProps> = ({
  onAddMediaType,
  onRemoveMediaType,
  availableMediaTypes,
  selectedMediaTypes,
  onSelectMediaType,
  onReorderMediaTypes,
  currentUserId,
}) => {
  const [mediaTypeSearchTerm, setMediaTypeSearchTerm] = useState('');
  const [selectedMediaTypesToAdd, setSelectedMediaTypesToAdd] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredMediaTypes = availableMediaTypes
    .filter(type => !selectedMediaTypes.includes(type))
    .filter(type => 
      type.toLowerCase().includes(mediaTypeSearchTerm.toLowerCase())
    );

  const handleToggleMediaTypeSelection = (mediaType: string, checked: boolean) => {
    if (checked) {
      setSelectedMediaTypesToAdd(prev => [...prev, mediaType]);
    } else {
      setSelectedMediaTypesToAdd(prev => prev.filter(t => t !== mediaType));
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

  const handleReorderMediaTypes = async (newOrder: string[]) => {
    if (onReorderMediaTypes) {
      onReorderMediaTypes(newOrder);
    }
    
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
  };

  return (
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
          <SearchableList
            items={filteredMediaTypes}
            searchTerm={mediaTypeSearchTerm}
            selectedItems={selectedMediaTypesToAdd}
            onSearchChange={setMediaTypeSearchTerm}
            onToggleSelection={handleToggleMediaTypeSelection}
            onAddSelected={handleSelectMultipleMediaTypes}
            emptyMessage="No matching media types found"
            noResultsMessage="No media types available"
            addButtonText="Add Selected Media Types"
          />
        </div>
      </div>
      
      <div className="mb-2 text-sm text-muted-foreground">
        Drag items to reorder. Items at the top of the list will appear first in your timesheet.
      </div>
      
      <SortableItemsList
        items={selectedMediaTypes}
        onReorder={handleReorderMediaTypes}
        onRemoveItem={onRemoveMediaType}
        emptyMessage="No media types selected. Please select media types from the list above."
        isSystemItem={() => false}
      />
    </div>
  );
};
