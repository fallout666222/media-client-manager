
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as db from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ 
  children,
  userId
}) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load user settings from the database
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await db.getUserSettings(userId);
        
        if (error) {
          console.error('Error loading user settings:', error);
          toast({
            title: "Error",
            description: "Failed to load user settings",
            variant: "destructive"
          });
          return;
        }

        if (data) {
          // Set theme
          const userTheme = data.dark_theme ? 'dark' : 'light';
          setThemeState(userTheme);
          applyTheme(userTheme);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [userId, toast]);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Update theme in the database and apply it
  const setTheme = async (newTheme: Theme) => {
    if (!userId) return;
    
    try {
      setThemeState(newTheme);
      applyTheme(newTheme);
      
      await db.updateUserSettings(userId, { dark_theme: newTheme === 'dark' });
      
      toast({
        title: "Theme updated",
        description: `Theme set to ${newTheme}`
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive"
      });
    }
  };

  const value = {
    theme,
    setTheme,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
