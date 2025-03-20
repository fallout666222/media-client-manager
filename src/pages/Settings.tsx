import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserSettings } from '@/components/UserSettings';
import { useSettings } from '@/contexts/SettingsContext';
import * as db from '@/integrations/supabase/database';
import { Client } from '@/types/timesheet';
import { useTimeSheetPreferences } from '@/hooks/useTimeSheetPreferences';
import { useToast } from '@/hooks/use-toast';

interface SettingsPageProps {
  currentUser: any;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser }) => {
  const [clients, setClients] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [availableClients, setAvailableClients] = useState<string[]>([]);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [visibleClients, setVisibleClients] = useState<Client[]>([]);
  const { toast } = useToast();
  
  const { handleSaveVisibleClients, handleSaveVisibleMediaTypes } = useTimeSheetPreferences({
    currentUser
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const { data: clientsData } = await db.getClients();
        if (clientsData) {
          const clientNames = clientsData.map(client => client.name);
          setClients(clientNames);
          setAvailableClients(clientNames);
          setVisibleClients(clientsData);
        }

        // Fetch media types
        const { data: mediaTypesData } = await db.getMediaTypes();
        if (mediaTypesData) {
          const mediaTypeNames = mediaTypesData.map(type => type.name);
          setMediaTypes(mediaTypeNames);
          setAvailableMediaTypes(mediaTypeNames);
        }

        // Fetch user's visible clients
        if (currentUser.id) {
          const { data: userVisibleClients } = await db.getUserVisibleClients(currentUser.id);
          if (userVisibleClients) {
            const visibleClientNames = userVisibleClients.map(vc => vc.client?.name || '').filter(name => name);
            setSelectedClients(visibleClientNames);
            console.log("Loaded visible clients:", visibleClientNames);
          }

          // Fetch user's visible media types
          const { data: userVisibleTypes } = await db.getUserVisibleTypes(currentUser.id);
          if (userVisibleTypes) {
            const visibleTypeNames = userVisibleTypes.map(vt => vt.type?.name || '').filter(name => name);
            setSelectedMediaTypes(visibleTypeNames);
            console.log("Loaded visible media types:", visibleTypeNames);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [currentUser.id]);

  const handleAddClient = (client: string) => {
    setClients(prev => [...prev, client]);
  };

  const handleRemoveClient = (client: string) => {
    const updatedClients = selectedClients.filter(c => c !== client);
    setSelectedClients(updatedClients);
    handleSaveVisibleClients(updatedClients);
  };

  const handleAddMediaType = (type: string) => {
    setMediaTypes(prev => [...prev, type]);
  };

  const handleRemoveMediaType = (type: string) => {
    const updatedTypes = selectedMediaTypes.filter(t => t !== type);
    setSelectedMediaTypes(updatedTypes);
    handleSaveVisibleMediaTypes(updatedTypes);
  };

  const handleSelectClient = async (client: string) => {
    console.log("Selecting client:", client);
    if (!selectedClients.includes(client)) {
      const newSelectedClients = [...selectedClients, client];
      setSelectedClients(newSelectedClients);
      await handleSaveVisibleClients(newSelectedClients);
    }
  };

  const handleSelectMultipleClients = async (clients: string[]) => {
    console.log("Selecting multiple clients:", clients);
    if (!clients.length) return;
    
    // Create a new array with all unique clients
    const newSelectedClients = [...new Set([...selectedClients, ...clients])];
    console.log("New selected clients:", newSelectedClients);
    
    // Update state with the new clients
    setSelectedClients(newSelectedClients);
    
    // Save the updated clients list to the database
    await handleSaveVisibleClients(newSelectedClients);
    
    toast({
      title: "Clients Updated",
      description: `Added ${clients.length} clients to your visible clients`,
    });
  };

  const handleSelectMediaType = async (type: string) => {
    console.log("Selecting media type:", type);
    if (!selectedMediaTypes.includes(type)) {
      const newSelectedMediaTypes = [...selectedMediaTypes, type];
      setSelectedMediaTypes(newSelectedMediaTypes);
      await handleSaveVisibleMediaTypes(newSelectedMediaTypes);
      
      toast({
        title: "Media Type Added",
        description: `Added ${type} to your visible media types`,
      });
    } else {
      console.log(`${type} already in selected media types`);
    }
  };

  const handleReorderClients = async (newOrder: string[]) => {
    console.log("Reordering clients:", newOrder);
    setSelectedClients(newOrder);
    await handleSaveVisibleClients(newOrder);
  };

  const handleReorderMediaTypes = async (newOrder: string[]) => {
    console.log("Reordering media types:", newOrder);
    setSelectedMediaTypes(newOrder);
    await handleSaveVisibleMediaTypes(newOrder);
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Settings
        </h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <UserSettings 
        userId={currentUser.id}
        clients={clients}
        mediaTypes={mediaTypes}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
        userRole={currentUser.role || 'user'}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={handleSelectClient}
        onSelectMultipleClients={handleSelectMultipleClients}
        onSelectMediaType={handleSelectMediaType}
        onReorderClients={handleReorderClients}
        onReorderMediaTypes={handleReorderMediaTypes}
        visibleClients={visibleClients}
        currentUserId={currentUser.id}
      />
    </div>
  );
};

export default SettingsPage;
