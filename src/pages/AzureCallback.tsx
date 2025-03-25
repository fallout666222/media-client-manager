
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/timesheet';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const AzureCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { handleLogin } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    const processAzureCallback = async () => {
      try {
        setLoading(true);
        
        // Supabase handles the OAuth callback automatically
        // We just need to get the session data once the callback is complete
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session || !session.user) {
          console.error('No session or user found');
          throw new Error('Не удалось получить данные сессии');
        }
        
        console.log('Session retrieved:', session);
        
        // Get user profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          
          // Try to wait a moment and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryProfileData, error: retryError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (retryError) {
            console.error('Error on retry fetching user profile:', retryError);
            throw new Error('Не удалось получить профиль пользователя');
          }
          
          profileData = retryProfileData;
        }
        
        if (!profileData) {
          console.error('No profile data found');
          throw new Error('Профиль пользователя не найден');
        }
        
        console.log('Profile data retrieved:', profileData);
        
        // Create a properly formatted User object with ALL fields
        const appUser: User = {
          id: session.user.id,
          username: profileData.login,
          name: profileData.name,
          role: profileData.type as 'admin' | 'user' | 'manager',
          email: session.user.email,
          type: profileData.type,
          login: profileData.login,
          job_position: profileData.job_position,
          description: profileData.description,
          department_id: profileData.department_id,
          departmentId: profileData.department_id,
          first_week: profileData.first_week,
          firstWeek: profileData.first_week,
          first_custom_week_id: profileData.first_custom_week_id,
          firstCustomWeekId: profileData.first_custom_week_id,
          deletion_mark: false,
          user_head_id: profileData.user_head_id,
          hidden: profileData.hidden,
          dark_theme: profileData.dark_theme,
          language: profileData.language
        };
        
        console.log('App user object created:', appUser);
        
        // Save user data to localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        // Update app state
        await handleLogin(appUser);
        
        // Show success message
        toast({
          title: "Аутентификация через Azure AD успешна",
          description: `Вы вошли как ${appUser.name}`,
        });
        
        // Redirect to the main app
        navigate('/');
      } catch (err) {
        console.error('Ошибка обработки Azure callback:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        
        toast({
          title: "Ошибка аутентификации",
          description: err instanceof Error ? err.message : 'Не удалось аутентифицироваться через Azure AD',
          variant: "destructive",
        });
        
        // Redirect to login page after a delay
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    processAzureCallback();
  }, [navigate, handleLogin, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Обработка аутентификации...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-4">Ошибка аутентификации</h2>
          <p>{error}</p>
          <p className="mt-4">Перенаправление на страницу входа...</p>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Аутентификация успешна!</h2>
          <p>Перенаправление в приложение...</p>
        </div>
      )}
    </div>
  );
};

export default AzureCallback;
