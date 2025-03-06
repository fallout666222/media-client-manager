
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as db from "@/integrations/supabase/database";

const MediaTypeManagement = () => {
  const [mediaTypes, setMediaTypes] = useState<any[]>([]);
  const [newMediaType, setNewMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch media types on component mount
  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await db.getMediaTypes();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setMediaTypes(data);
        }
      } catch (error) {
        console.error('Error fetching media types:', error);
        toast({
          title: "Error",
          description: "Failed to load media types",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMediaTypes();
  }, [toast]);

  const handleAddMediaType = async () => {
    if (!newMediaType.trim()) {
      toast({
        title: "Error",
        description: "Media type name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if media type already exists
    if (mediaTypes.some(type => type.name.toLowerCase() === newMediaType.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "Media type already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await db.createMediaType({ name: newMediaType.trim() });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMediaTypes([...mediaTypes, data]);
        setNewMediaType('');
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
    }
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Media Type Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Add Media Type</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter new media type name"
              value={newMediaType}
              onChange={(e) => setNewMediaType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMediaType()}
            />
            <Button onClick={handleAddMediaType} disabled={!newMediaType.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Media Types</h2>
          {isLoading ? (
            <div className="text-center py-4">Loading media types...</div>
          ) : mediaTypes.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No media types found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediaTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      {type.created_at ? new Date(type.created_at).toLocaleString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaTypeManagement;
