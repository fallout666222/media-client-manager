
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as db from "../integrations/supabase/database";

interface MediaType {
  id: string;
  name: string;
  description: string | null;
}

const MediaTypeManagement = () => {
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [newMediaType, setNewMediaType] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMediaTypes();
  }, []);

  const fetchMediaTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getMediaTypes();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log("Fetched media types:", data);
        setMediaTypes(data);
      }
    } catch (error) {
      console.error("Error fetching media types:", error);
      toast({
        title: "Error",
        description: "Failed to load media types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMediaType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMediaType.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Media type name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await db.createMediaType(newMediaType);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMediaTypes([...mediaTypes, data]);
        setNewMediaType({ name: "", description: "" });
        toast({
          title: "Success",
          description: "Media type created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating media type:", error);
      toast({
        title: "Error",
        description: "Failed to create media type",
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
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Media Type</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMediaType} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={newMediaType.name}
                    onChange={(e) => setNewMediaType({ ...newMediaType, name: e.target.value })}
                    placeholder="Enter media type name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium">
                    Description
                  </label>
                  <Input
                    id="description"
                    value={newMediaType.description}
                    onChange={(e) => setNewMediaType({ ...newMediaType, description: e.target.value })}
                    placeholder="Enter description (optional)"
                  />
                </div>
              </div>
              <Button type="submit">Add Media Type</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Media Types</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading media types...</div>
            ) : mediaTypes.length === 0 ? (
              <div className="text-center py-4">No media types found</div>
            ) : (
              <Table>
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
                      <TableCell>{mediaType.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaTypeManagement;
