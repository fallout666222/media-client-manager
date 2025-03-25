
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { User } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AzureAuthProps {
  onLogin: (user: User) => void;
}

export const AzureAuth: React.FC<AzureAuthProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAzureLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Azure AD URL is configured
      const azureAdUrl = import.meta.env.VITE_AZURE_AD_URL;
      const redirectUrl = `${window.location.origin}/auth/azure-callback`;
      
      if (!azureAdUrl) {
        throw new Error('azure_not_configured');
      }
      
      // Use Supabase Auth with Azure AD provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email profile openid',
        }
      });

      if (error) {
        throw error;
      }
      
      if (data?.url) {
        // Redirect to Azure AD login page
        window.location.href = data.url;
      }
      
    } catch (error) {
      console.error('Azure AD login error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'unknown_error';
      
      // Set appropriate error message based on error type
      switch(errorMessage) {
        case 'azure_not_configured':
          setError('Azure AD не настроен. Пожалуйста, обратитесь к администратору системы.');
          break;
        case 'azure_connection_error':
          setError('Не удалось подключиться к серверу Azure AD. Проверьте сетевое подключение.');
          break;
        default:
          setError('Произошла ошибка при авторизации через Azure AD. Пожалуйста, попробуйте позже.');
      }
      
      toast({
        title: "Ошибка аутентификации через Azure AD",
        description: "Возникла проблема с единым входом. Пожалуйста, попробуйте еще раз или используйте другой метод входа.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          Войдите с помощью корпоративной учетной записи Azure Active Directory.
          Вы будете перенаправлены на страницу входа вашей организации.
        </AlertDescription>
      </Alert>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        className="w-full"
        onClick={handleAzureLogin}
        disabled={loading}
      >
        {loading ? "Перенаправление..." : "Войти через Azure AD"}
      </Button>
    </div>
  );
};
