
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
        
        if (!code) {
          throw new Error('No authorization code received from ADFS');
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
          throw new Error('Failed to exchange authorization code for tokens');
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
          throw new Error('No email or UPN found in ID token');
        }
        
        // Now find the user in your database using Supabase
        // You might need to adjust this based on your database schema
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', userEmail)
          .single();
        
        if (error || !data) {
          throw new Error('User not found in the system');
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
          title: "Welcome back!",
          description: `You are now logged in as ${data.name}`
        });
        
        // Redirect to the main page
        navigate('/');
        
      } catch (error) {
        console.error('ADFS callback error:', error);
        setError('Authentication failed. Please try again or contact support.');
        toast({
          title: "Authentication Failed",
          description: "There was a problem completing the ADFS authentication.",
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
              Return to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
