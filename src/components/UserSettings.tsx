
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from "@/components/ui/button";
import { Moon, Sun, Languages } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from '@/components/TimeSheet/Settings';

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
}

const translations = {
  en: {
    appearance: "Appearance",
    themeSettings: "Theme Settings",
    darkMode: "Dark Mode",
    language: "Language",
    languageSettings: "Language Settings",
    english: "English",
    russian: "Russian",
    timesheet: "Timesheet",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    visibleClients: "Visible Clients",
    visibleMedia: "Visible Media Types",
    settings: "Settings",
    appSettings: "Application Settings",
    systemPreferences: "System Preferences"
  },
  ru: {
    appearance: "Внешний вид",
    themeSettings: "Настройки темы",
    darkMode: "Темная тема",
    language: "Язык",
    languageSettings: "Настройки языка",
    english: "Английский",
    russian: "Русский",
    timesheet: "Табель",
    theme: "Тема",
    light: "Светлая",
    dark: "Темная",
    visibleClients: "Видимые клиенты",
    visibleMedia: "Видимые типы медиа",
    settings: "Настройки",
    appSettings: "Настройки приложения",
    systemPreferences: "Системные настройки"
  }
};

export const UserSettings: React.FC<UserSettingsProps> = (props) => {
  const { theme, language, setTheme, setLanguage, isLoading } = useSettings();

  const t = translations[language];

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading settings...</div>;
  }

  const renderThemeLanguageSettings = () => (
    <div className="mt-10 border-t pt-6">
      <h2 className="text-xl font-bold mb-4">
        {language === 'en' ? 'System Preferences' : 'Системные настройки'}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {t.themeSettings}
            </CardTitle>
            <CardDescription>{t.theme}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                {t.darkMode}
              </Label>
              <Switch 
                id="dark-mode" 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t.languageSettings}
            </CardTitle>
            <CardDescription>{t.language}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={language === 'en' ? 'default' : 'outline'} 
                onClick={() => setLanguage('en')}
                className="flex-1"
              >
                {t.english}
              </Button>
              <Button 
                variant={language === 'ru' ? 'default' : 'outline'} 
                onClick={() => setLanguage('ru')}
                className="flex-1"
              >
                {t.russian}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="timesheet" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="timesheet">{t.timesheet}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="timesheet">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'en' ? 'Timesheet Settings' : 'Настройки табеля'}
            </CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Configure your visible clients and media types' 
                : 'Настройте видимые клиенты и типы медиа'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Settings {...props} />
            {renderThemeLanguageSettings()}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
