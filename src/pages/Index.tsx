
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { getCustomWeeks } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { user, customWeeks } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
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
                title: "Database Connection Error",
                description: "Could not connect to the database. Please check your connection settings.",
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
            title: "Error",
            description: "Could not load user preferences. Please try again later.",
            variant: "destructive",
          });
        }
      } else {
        // If no user is logged in, redirect to login page
        navigate('/login');
      }
    };
    
    loadUserPreferences();
  }, [user, navigate, toast]);

  // Show a loading or welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-xl p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Timesheet App</h1>
        <p className="text-xl text-gray-600 mb-6">Manage your time efficiently</p>
        {!user && (
          <p className="text-gray-500">Redirecting to login page...</p>
        )}
        {user && (
          <p className="text-gray-500">Loading your timesheet data...</p>
        )}
      </div>
    </div>
  );
};

export default Index;
