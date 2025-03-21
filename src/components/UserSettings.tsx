
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from '@/components/TimeSheet/Settings';
import { useToast } from '@/hooks/use-toast';

interface UserSettingsProps {
  userId?: string;
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
  onReorderClients?: (clients: string[]) => void;
  onReorderMediaTypes?: (types: string[]) => void;
  visibleClients?: any[];
  currentUserId?: string;
  onSelectMultipleClients?: (clients: string[]) => void;
}

export const UserSettings: React.FC<UserSettingsProps> = (props) => {
  const { theme, setTheme, isLoading } = useSettings();
  const { toast } = useToast();

  const handleSystemClientSelected = (systemClientName: string) => {
    console.log("System client selected in UserSettings:", systemClientName);
    if (!props.selectedMediaTypes.includes("Administrative")) {
      console.log("Adding Administrative media type");
      props.onSelectMediaType("Administrative");
      toast({
        title: "Media Type Added",
        description: "Administrative media type was automatically added as you selected a system client.",
      });
    } else {
      console.log("Administrative media type already exists");
    }
  };

  const handleSelectMultipleClients = (clients: string[]) => {
    console.log("Handling multiple clients in UserSettings:", clients);
    if (props.onSelectMultipleClients) {
      props.onSelectMultipleClients(clients);
    } else {
      // Fallback to adding clients one by one
      for (const client of clients) {
        if (!props.selectedClients.includes(client)) {
          props.onSelectClient(client);
        }
      }
    }
  };

  // For debugging
  useEffect(() => {
    console.log("UserSettings - Current selected clients:", props.selectedClients);
    console.log("UserSettings - Current selected media types:", props.selectedMediaTypes);
  }, [props.selectedClients, props.selectedMediaTypes]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading settings...</div>;
  }

  const renderThemeSettings = () => (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-xl font-bold mb-4">
        System Preferences
      </h2>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Theme Settings
            </CardTitle>
            <CardDescription>Theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Dark Mode
              </Label>
              <Switch 
                id="dark-mode" 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="timesheet" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
      </TabsList>
      
      <TabsContent value="timesheet">
        <Card>
          <CardHeader>
            <CardTitle>
              Timesheet Settings
            </CardTitle>
            <CardDescription>
              Configure your visible clients and media types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Settings 
              {...props} 
              onSelectSystemClient={handleSystemClientSelected}
              onSelectMultipleClients={handleSelectMultipleClients}
            />
            {renderThemeSettings()}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
