
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/timesheet';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export const AdfsCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { handleLogin } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would validate the ADFS token
        // and get the user details from your backend
        
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in URL');
        }
        
        // For this client-side example, mock a successful authentication response
        // In a real implementation, this would call your Supabase function to exchange the code for a token
        console.log('Received ADFS code:', code);
        
        // Simulate a successful auth response (would normally come from exchanging the code)
        const mockUser = {
          id: '1',
          login: 'admin',
          name: 'Administrator',
          type: 'admin',
          password: '', // Not needed for ADFS auth
          first_week: '2024-01-01',
          first_custom_week_id: null,
          email: 'admin@example.com',
          job_position: 'Administrator',
          description: 'System Administrator',
          department_id: '1',
          deletion_mark: false,
          user_head_id: null,
          hidden: false,
        };
        
        // Create a properly typed User object
        const appUser: User = {
          id: mockUser.id,
          username: mockUser.login,
          name: mockUser.name,
          role: mockUser.type as 'admin' | 'user' | 'manager',
          password: '',
          firstWeek: mockUser.first_week,
          firstCustomWeekId: mockUser.first_custom_week_id,
          login: mockUser.login,
          type: mockUser.type,
          email: mockUser.email,
          job_position: mockUser.job_position,
          description: mockUser.description,
          department_id: mockUser.department_id,
          departmentId: mockUser.department_id,
          deletion_mark: mockUser.deletion_mark,
          user_head_id: mockUser.user_head_id,
          hidden: mockUser.hidden,
        };
        
        // Save to localStorage
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        // Update app state
        await handleLogin(appUser);
        
        // Show success message
        toast({
          title: "ADFS Authentication Successful",
          description: `You are now logged in as ${appUser.name}`,
        });
        
        // Redirect to the main app
        navigate('/');
      } catch (err) {
        console.error('Error processing ADFS callback:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        
        toast({
          title: "Authentication Failed",
          description: err instanceof Error ? err.message : 'Failed to authenticate with ADFS',
          variant: "destructive",
        });
        
        // Redirect to login page after a delay
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    processCallback();
  }, [navigate, handleLogin, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {loading ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Processing authentication...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-4">Authentication Error</h2>
          <p>{error}</p>
          <p className="mt-4">Redirecting to login page...</p>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication successful!</h2>
          <p>Redirecting to application...</p>
        </div>
      )}
    </div>
  );
};
