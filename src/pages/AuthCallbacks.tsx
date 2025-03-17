
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/timesheet';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const AdfsCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAdfsCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          let russianErrorMessage = 'Произошла ошибка при аутентификации через ADFS.';
          
          switch(errorParam) {
            case 'access_denied':
              russianErrorMessage = 'Доступ запрещен. Авторизация была отклонена.';
              break;
            case 'invalid_request':
              russianErrorMessage = 'Неверный запрос аутентификации.';
              break;
            case 'unauthorized_client':
              russianErrorMessage = 'Клиент не авторизован для выполнения этого запроса.';
              break;
            case 'server_error':
              russianErrorMessage = 'Произошла ошибка на сервере ADFS.';
              break;
          }
          
          if (errorDescription) {
            russianErrorMessage += ` Детали: ${errorDescription}`;
          }
          
          throw new Error(russianErrorMessage);
        }
        
        if (!code) {
          throw new Error('Не получен код авторизации от ADFS');
        }
        
        // Exchange the code for tokens using a secure backend function
        const { data, error } = await supabase.functions.invoke('adfs-token-exchange', {
          body: { 
            code, 
            redirectUri: window.location.origin + '/auth/adfs-callback'
          }
        });
        
        if (error) {
          console.error('Token exchange error:', error);
          throw new Error(`Ошибка при обмене кода на токены: ${error.message}`);
        }
        
        if (!data || !data.user) {
          throw new Error('Не удалось получить информацию о пользователе');
        }
        
        // Create a properly formatted User object
        const userRole = data.user.type as 'admin' | 'user' | 'manager';
        
        const appUser: User = {
          id: data.user.id,
          username: data.user.login,
          name: data.user.name,
          role: userRole,
          password: data.user.password,
          firstWeek: data.user.first_week,
          firstCustomWeekId: data.user.first_custom_week_id,
          login: data.user.login,
          type: data.user.type,
          email: data.user.email,
          job_position: data.user.job_position,
          description: data.user.description,
          department_id: data.user.department_id,
          departmentId: data.user.department_id,
          deletion_mark: data.user.deletion_mark,
          user_head_id: data.user.user_head_id,
          hidden: data.user.hidden
        };
        
        // Check if user has unconfirmed weeks
        try {
          const { getUserFirstUnconfirmedWeek } = await import('@/integrations/supabase/database');
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(data.user.id);
          if (firstUnconfirmedWeek) {
            // Store redirect info in session cookie instead of localStorage
            const redirectData = JSON.stringify({
              weekId: firstUnconfirmedWeek.id,
              date: firstUnconfirmedWeek.period_from
            });
            document.cookie = `redirectToWeek=${encodeURIComponent(redirectData)}; path=/; SameSite=Strict`;
          }
        } catch (error) {
          console.error('Error getting first unconfirmed week:', error);
        }
        
        // Show success toast
        toast({
          title: "Добро пожаловать!",
          description: `Вы успешно вошли в систему как ${data.user.name}`
        });
        
        // Redirect to the main page
        navigate('/');
        
      } catch (error) {
        console.error('ADFS callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка аутентификации';
        setError(errorMessage);
        toast({
          title: "Ошибка аутентификации",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    handleAdfsCallback();
  }, [location, navigate, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Завершение аутентификации...</p>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              className="text-blue-500 hover:underline"
              onClick={() => navigate('/login')}
            >
              Вернуться на страницу входа
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const SamlCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSamlCallback = async () => {
      try {
        // Get the SAML response from the URL or post data
        const urlParams = new URLSearchParams(location.search);
        const samlResponse = urlParams.get('SAMLResponse');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          let russianErrorMessage = 'Произошла ошибка при аутентификации через SAML.';
          
          if (errorDescription) {
            russianErrorMessage += ` Детали: ${errorDescription}`;
          }
          
          throw new Error(russianErrorMessage);
        }
        
        if (!samlResponse) {
          throw new Error('Не получен SAML ответ от провайдера идентификации');
        }
        
        // Process the SAML response using a secure backend function
        const { data, error } = await supabase.functions.invoke('saml-validate', {
          body: { 
            samlResponse,
            redirectUri: window.location.origin + '/auth/saml-callback'
          }
        });
        
        if (error) {
          console.error('SAML validation error:', error);
          throw new Error(`Ошибка при проверке SAML ответа: ${error.message}`);
        }
        
        if (!data || !data.user) {
          throw new Error('Не удалось получить информацию о пользователе');
        }
        
        // Create a properly formatted User object
        const userRole = data.user.type as 'admin' | 'user' | 'manager';
        
        const appUser: User = {
          id: data.user.id,
          username: data.user.login,
          name: data.user.name,
          role: userRole,
          password: data.user.password,
          firstWeek: data.user.first_week,
          firstCustomWeekId: data.user.first_custom_week_id,
          login: data.user.login,
          type: data.user.type,
          email: data.user.email,
          job_position: data.user.job_position,
          description: data.user.description,
          department_id: data.user.department_id,
          departmentId: data.user.department_id,
          deletion_mark: data.user.deletion_mark,
          user_head_id: data.user.user_head_id,
          hidden: data.user.hidden
        };
        
        // Check if user has unconfirmed weeks
        try {
          const { getUserFirstUnconfirmedWeek } = await import('@/integrations/supabase/database');
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(data.user.id);
          if (firstUnconfirmedWeek) {
            // Store redirect info in session cookie
            const redirectData = JSON.stringify({
              weekId: firstUnconfirmedWeek.id,
              date: firstUnconfirmedWeek.period_from
            });
            document.cookie = `redirectToWeek=${encodeURIComponent(redirectData)}; path=/; SameSite=Strict`;
          }
        } catch (error) {
          console.error('Error getting first unconfirmed week:', error);
        }
        
        // Show success toast
        toast({
          title: "Добро пожаловать!",
          description: `Вы успешно вошли в систему как ${data.user.name}`
        });
        
        // Save user data to localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        // Redirect to the main page
        navigate('/');
        
      } catch (error) {
        console.error('SAML callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка аутентификации';
        setError(errorMessage);
        toast({
          title: "Ошибка аутентификации",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    handleSamlCallback();
  }, [location, navigate, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Завершение аутентификации SAML...</p>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-b-transparent border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              className="text-blue-500 hover:underline"
              onClick={() => navigate('/login')}
            >
              Вернуться на страницу входа
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
