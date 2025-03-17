
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/timesheet';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SamlCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSamlCallback = async () => {
      try {
        // Get the SAML response from the form post
        const urlParams = new URLSearchParams(location.search);
        const samlResponse = urlParams.get('SAMLResponse');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          throw new Error(`SAML authentication error: ${errorDescription || errorParam}`);
        }
        
        if (!samlResponse) {
          throw new Error('No SAML response received from identity provider');
        }
        
        // Exchange the SAML response for user data using a secure backend function
        const { data, error } = await supabase.functions.invoke('saml-assertion-validation', {
          body: { 
            samlResponse,
            redirectUri: window.location.origin + '/auth/saml-callback'
          }
        });
        
        if (error) {
          console.error('SAML validation error:', error);
          throw new Error(`Error validating SAML assertion: ${error.message}`);
        }
        
        if (!data || !data.user) {
          throw new Error('Failed to retrieve user information');
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
        
        // Save user data to localStorage for session persistence
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
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
          title: "Welcome!",
          description: `You have successfully logged in as ${data.user.name}`
        });
        
        // Redirect to the main page
        navigate('/');
        
      } catch (error) {
        console.error('SAML callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
        setError(errorMessage);
        toast({
          title: "Authentication Error",
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
          <p className="mb-4">Completing authentication...</p>
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
              Return to login page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
