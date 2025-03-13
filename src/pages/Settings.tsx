import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserSettings } from '@/components/UserSettings';
import { useSettings } from '@/contexts/SettingsContext';
import * as db from '@/integrations/supabase/database';
import { Client } from '@/types/timesheet';
import { useTimeSheetPreferences } from '@/hooks/useTimeSheetPreferences';

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
  const { language } = useSettings();
  
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
          }

          // Fetch user's visible media types
          const { data: userVisibleTypes } = await db.getUserVisibleTypes(currentUser.id);
          if (userVisibleTypes) {
            const visibleTypeNames = userVisibleTypes.map(vt => vt.type?.name || '').filter(name => name);
            setSelectedMediaTypes(visibleTypeNames);
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
    setSelectedClients(prev => prev.filter(c => c !== client));
    handleSaveVisibleClients(selectedClients.filter(c => c !== client));
  };

  const handleAddMediaType = (type: string) => {
    setMediaTypes(prev => [...prev, type]);
  };

  const handleRemoveMediaType = (type: string) => {
    setSelectedMediaTypes(prev => prev.filter(t => t !== type));
    handleSaveVisibleMediaTypes(selectedMediaTypes.filter(t => t !== type));
  };

  const handleSelectClient = (client: string) => {
    const newSelectedClients = [...selectedClients, client];
    setSelectedClients(newSelectedClients);
    handleSaveVisibleClients(newSelectedClients);
  };

  const handleSelectMediaType = (type: string) => {
    const newSelectedMediaTypes = [...selectedMediaTypes, type];
    setSelectedMediaTypes(newSelectedMediaTypes);
    handleSaveVisibleMediaTypes(newSelectedMediaTypes);
  };

  const handleReorderClients = (newOrder: string[]) => {
    setSelectedClients(newOrder);
  };

  const handleReorderMediaTypes = (newOrder: string[]) => {
    setSelectedMediaTypes(newOrder);
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {language === 'en' ? 'Settings' : 'Настройки'}
        </h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Back to Dashboard' : 'Назад к главной'}
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
