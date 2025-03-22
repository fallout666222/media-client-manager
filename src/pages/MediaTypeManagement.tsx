
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import * as db from '@/integrations/supabase/database';

interface MediaType {
  id: string;
  name: string;
  description?: string;
}

interface MediaTypeManagementProps {
  mediaTypes: MediaType[];
  onAddMediaType: (mediaType: Omit<MediaType, "id">) => void;
}

const MediaTypeManagement: React.FC<MediaTypeManagementProps> = ({ mediaTypes, onAddMediaType }) => {
  const [mediaTypeName, setMediaTypeName] = useState('');
  const [mediaTypeDescription, setMediaTypeDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        const { data } = await db.getMediaTypes();
        // We don't need to do anything with the data here since the parent component handles it
      } catch (error) {
        console.error('Error fetching media types:', error);
      }
    };

    fetchMediaTypes();
  }, []);

  const handleAddMediaType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaTypeName.trim()) {
      toast({
        title: "Error",
        description: "Media type name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await db.createMediaType({ 
        name: mediaTypeName,
        description: mediaTypeDescription 
      });
      
      if (error) throw error;
      
      if (data) {
        // Call the parent's callback
        onAddMediaType({
          name: data.name,
          description: data.description
        });
        
        setMediaTypeName('');
        setMediaTypeDescription('');
        
        toast({
          title: "Success",
          description: "Media type added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding media type:', error);
      toast({
        title: "Error",
        description: "Failed to add media type",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Manage Media Types</h2>
      <form onSubmit={handleAddMediaType} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="mediaTypeName">Media Type Name</Label>
          <Input
            type="text"
            id="mediaTypeName"
            value={mediaTypeName}
            onChange={(e) => setMediaTypeName(e.target.value)}
            placeholder="Enter media type name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="mediaTypeDescription">Description</Label>
          <Textarea
            id="mediaTypeDescription"
            value={mediaTypeDescription}
            onChange={(e) => setMediaTypeDescription(e.target.value)}
            placeholder="Enter media type description"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Media Type"}
        </Button>
      </form>
      <Table>
        <TableCaption>A list of your media types.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mediaTypes.map((mediaType) => (
            <TableRow key={mediaType.id}>
              <TableCell className="font-medium">{mediaType.name}</TableCell>
              <TableCell>{mediaType.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MediaTypeManagement;
