
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/timesheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUserFirstUnconfirmedWeek } from '@/integrations/supabase/database';
import { decode as base64Decode } from 'base64-arraybuffer';

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
        
        // Instead of using edge functions, we'll just simulate authentication for now
        // In a real implementation, this would need to be replaced with your actual authentication logic
        
        // Simulate successful authentication and get a mock user
        const mockUser = await simulateAdfsAuthentication(code);
        
        if (!mockUser) {
          throw new Error('Не удалось получить информацию о пользователе');
        }
        
        // Check if user has unconfirmed weeks
        try {
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(mockUser.id);
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
        
        // Store the user in localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(mockUser));
        
        // Show success toast
        toast({
          title: "Добро пожаловать!",
          description: `Вы успешно вошли в систему как ${mockUser.name}`
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
        
        // Simulate SAML validation and authentication
        const mockUser = await simulateSamlAuthentication(samlResponse);
        
        if (!mockUser) {
          throw new Error('Не удалось получить информацию о пользователе');
        }
        
        // Check if user has unconfirmed weeks
        try {
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(mockUser.id);
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
        
        // Store the user in localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(mockUser));
        
        // Show success toast
        toast({
          title: "Добро пожаловать!",
          description: `Вы успешно вошли в систему как ${mockUser.name}`
        });
        
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

// Helper functions for simulating authentication
const simulateAdfsAuthentication = async (code: string): Promise<User | null> => {
  console.log('Simulating ADFS authentication with code:', code);
  
  // In a real implementation, this would be an API call to your authentication server
  // For demo purposes, we'll just return a fake user
  
  return {
    id: "adfs-user-123",
    username: "adfs.user",
    name: "ADFS Test User",
    role: "user",
    password: "",
    login: "adfs.user",
    type: "user",
    email: "adfs.user@example.com",
    firstWeek: "2023-01-01",
    job_position: "Developer",
    description: "",
    department_id: "dept-1",
    departmentId: "dept-1",
    deletion_mark: false,
    user_head_id: null,
    hidden: false
  };
};

const simulateSamlAuthentication = async (samlResponse: string): Promise<User | null> => {
  console.log('Simulating SAML authentication with response');
  
  // In a real implementation, you would parse and validate the SAML response
  // For demo purposes, we'll just return a fake user
  
  return {
    id: "saml-user-456",
    username: "saml.user",
    name: "SAML Test User",
    role: "user",
    password: "",
    login: "saml.user",
    type: "user",
    email: "saml.user@example.com",
    firstWeek: "2023-01-01",
    job_position: "Designer",
    description: "",
    department_id: "dept-2",
    departmentId: "dept-2",
    deletion_mark: false,
    user_head_id: null,
    hidden: false
  };
};
