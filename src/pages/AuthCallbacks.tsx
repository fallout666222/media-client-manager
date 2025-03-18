
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/timesheet';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { processSAMLCallback } from '@/utils/samlAuth';

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
        
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found in URL');
        }
        
        console.log('Received ADFS code:', code);
        
        // Process the SAML callback with the authorization code
        const userData = await processSAMLCallback(code);
        
        if (!userData) {
          throw new Error('Failed to process SAML authentication');
        }
        
        // Create a properly typed User object
        const appUser: User = {
          id: userData.id,
          username: userData.login,
          name: userData.name,
          role: userData.type as 'admin' | 'user' | 'manager',
          password: '',
          firstWeek: userData.first_week,
          firstCustomWeekId: userData.first_custom_week_id,
          login: userData.login,
          type: userData.type,
          email: userData.email,
          job_position: userData.job_position,
          description: userData.description,
          department_id: userData.department_id,
          departmentId: userData.department_id,
          deletion_mark: userData.deletion_mark,
          user_head_id: userData.user_head_id,
          hidden: userData.hidden,
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
