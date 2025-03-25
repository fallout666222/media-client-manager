
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getCustomWeeks } from '@/integrations/supabase/database';
import { testConnection, db } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, customWeeks } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnectionTesting, setIsConnectionTesting] = useState(true);
  
  // First check database connection
  useEffect(() => {
    const checkConnection = async () => {
      setIsConnectionTesting(true);
      const connectionResult = await testConnection();
      
      if (!connectionResult.success) {
        console.error('Failed to connect to database:', connectionResult.error);
        toast({
          title: "Ошибка подключения к базе данных",
          description: `Не удалось подключиться к ${
            connectionResult.environment === 'direct_postgres' 
              ? 'PostgreSQL напрямую' 
              : (connectionResult.environment === 'local' ? 'локальной' : 'удаленной') + ' базе данных'
          }. Проверьте настройки подключения и запущен ли сервер.`,
          variant: "destructive",
        });
      } else {
        console.log(`Successfully connected to ${connectionResult.environment} database`);
      }
      
      setIsConnectionTesting(false);
    };
    
    checkConnection();
  }, [toast]);
  
  // Then load user preferences if connection is available and user is logged in
  useEffect(() => {
    if (isConnectionTesting) return;
    
    const loadUserPreferences = async () => {
      if (user) {
        try {
          // Check if there's a saved week in localStorage
          const savedWeekId = localStorage.getItem(`selectedWeek_${user.id}`);
          
          if (savedWeekId) {
            // User has a saved week, load it
            const { data: weeksData, error } = await getCustomWeeks();
            
            if (error) {
              console.error('Error loading custom weeks:', error);
              toast({
                title: "Ошибка подключения к базе данных",
                description: "Не удалось загрузить пользовательские недели. Проверьте подключение к базе данных.",
                variant: "destructive",
              });
              return;
            }
            
            const savedWeek = weeksData?.find((week: any) => week.id === savedWeekId);
            
            if (savedWeek) {
              console.log('Found saved week in localStorage:', savedWeek.name);
              // Set the redirect flag to navigate to TimeSheet with the saved week
              localStorage.setItem('redirectToWeek', JSON.stringify({
                weekId: savedWeek.id,
                date: savedWeek.period_from
              }));
            }
          } else {
            // Check for unconfirmed weeks
            console.log('No saved week found, looking for first unconfirmed week');
            const { getUserFirstUnconfirmedWeek } = await import('@/integrations/supabase/database');
            
            try {
              const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(user.id);
              
              if (firstUnconfirmedWeek) {
                console.log('Found unconfirmed week to redirect to:', firstUnconfirmedWeek);
                // Set the redirect flag
                localStorage.setItem('redirectToWeek', JSON.stringify({
                  weekId: firstUnconfirmedWeek.id,
                  date: firstUnconfirmedWeek.period_from
                }));
              }
            } catch (error) {
              console.error('Error getting unconfirmed week:', error);
              // Continue without throwing - we'll just not redirect to an unconfirmed week
            }
          }
        } catch (error) {
          console.error('Error loading user preferences:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить пользовательские настройки. Попробуйте позже.",
            variant: "destructive",
          });
        }
      } else {
        // If no user is logged in, redirect to login page
        navigate('/login');
      }
    };
    
    loadUserPreferences();
  }, [user, navigate, toast, isConnectionTesting]);

  // Show a loading or welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-xl p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Добро пожаловать в Timesheet App</h1>
        <p className="text-xl text-gray-600 mb-6">Управляйте своим временем эффективно</p>
        {isConnectionTesting && (
          <p className="text-gray-500">Проверка подключения к базе данных...</p>
        )}
        {!isConnectionTesting && !user && (
          <p className="text-gray-500">Перенаправление на страницу входа...</p>
        )}
        {!isConnectionTesting && user && (
          <p className="text-gray-500">Загрузка данных вашего табеля...</p>
        )}
      </div>
    </div>
  );
};

export default Index;
