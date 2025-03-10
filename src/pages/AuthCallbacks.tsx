
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
        
        // Exchange the code for tokens
        // In a real implementation, this would be done securely on the backend
        const adfsUrl = import.meta.env.VITE_ADFS_URL || 'https://adfs.example.org/adfs';
        const clientId = import.meta.env.VITE_ADFS_CLIENT_ID || 'your-client-id';
        const clientSecret = import.meta.env.VITE_ADFS_CLIENT_SECRET || 'your-client-secret';
        const redirectUri = window.location.origin + '/auth/adfs-callback';
        
        // Usually this request should be made from a secure backend to protect client secret
        const response = await fetch(`${adfsUrl}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
          }),
        });
        
        if (!response.ok) {
          const responseData = await response.json().catch(() => null);
          
          if (responseData && responseData.error) {
            switch(responseData.error) {
              case 'invalid_grant':
                throw new Error('Недействительный код авторизации или истек срок его действия.');
              case 'invalid_client':
                throw new Error('Недопустимый ID клиента или секрет клиента.');
              case 'invalid_request':
                throw new Error('Неверный запрос обмена токенами.');
              default:
                throw new Error(`Ошибка при обмене кода на токены: ${responseData.error}`);
            }
          }
          
          throw new Error('Не удалось обменять код авторизации на токены.');
        }
        
        const tokenData = await response.json();
        
        // Parse the ID token to get user information
        // In a real implementation, you should validate the token
        const idToken = tokenData.id_token;
        const idTokenPayload = JSON.parse(atob(idToken.split('.')[1]));
        
        // Find the user in your system based on the claims in the ID token
        // For example, you might look up a user by email or UPN
        const userEmail = idTokenPayload.email || idTokenPayload.upn;
        
        if (!userEmail) {
          throw new Error('Не найден email или UPN в ID токене');
        }
        
        // Now find the user in your database using Supabase
        // You might need to adjust this based on your database schema
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();
        
        if (error || !data) {
          throw new Error(`Пользователь с email ${userEmail} не найден в системе`);
        }
        
        // Create a properly formatted User object
        const userRole = data.type as 'admin' | 'user' | 'manager';
        
        const appUser: User = {
          id: data.id,
          username: data.login,
          name: data.name,
          role: userRole,
          password: data.password,
          firstWeek: data.first_week,
          firstCustomWeekId: data.first_custom_week_id,
          login: data.login,
          type: data.type,
          email: data.email,
          job_position: data.job_position,
          description: data.description,
          department_id: data.department_id,
          departmentId: data.department_id,
          deletion_mark: data.deletion_mark,
          user_head_id: data.user_head_id,
          hidden: data.hidden
        };
        
        // Save user data to localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        // Check if user has unconfirmed weeks
        try {
          const { getUserFirstUnconfirmedWeek } = await import('@/integrations/supabase/database');
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(data.id);
          if (firstUnconfirmedWeek) {
            localStorage.setItem('redirectToWeek', JSON.stringify({
              weekId: firstUnconfirmedWeek.id,
              date: firstUnconfirmedWeek.period_from
            }));
          }
        } catch (error) {
          console.error('Error getting first unconfirmed week:', error);
        }
        
        // Show success toast
        toast({
          title: "Добро пожаловать!",
          description: `Вы успешно вошли в систему как ${data.name}`
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
