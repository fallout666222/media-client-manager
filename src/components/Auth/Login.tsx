import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/timesheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const Login = ({
  onLogin,
  users
}: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [kerberosLoading, setKerberosLoading] = useState(false);
  const [kerberosError, setKerberosError] = useState<string | null>(null);

  const handleFormSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      const {
        authenticateUser,
        getUserFirstUnconfirmedWeek
      } = await import('@/integrations/supabase/database');
      const {
        data,
        error
      } = await authenticateUser(username, password);
      if (error) {
        console.error('Authentication error:', error);
        toast({
          title: "Authentication Error",
          description: "Invalid username or password",
          variant: "destructive"
        });
        return;
      }
      if (data) {
        console.log('Authentication successful:', data);

        // Properly cast the role type to satisfy TypeScript
        const userRole = data.type as 'admin' | 'user' | 'manager';

        // Create a properly formatted User object with ALL fields
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
        
        onLogin(appUser);
        toast({
          title: "Welcome back!",
          description: `You are now logged in as ${data.name}`
        });

        // Check if user has unconfirmed or needs-revision weeks
        try {
          console.log('Checking for unconfirmed weeks for user:', data.id);
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(data.id);
          if (firstUnconfirmedWeek) {
            console.log('Found unconfirmed week to redirect to:', firstUnconfirmedWeek);
            // Set the first unconfirmed week in localStorage to redirect after login
            localStorage.setItem('redirectToWeek', JSON.stringify({
              weekId: firstUnconfirmedWeek.id,
              date: firstUnconfirmedWeek.period_from
            }));
          } else {
            console.log('No unconfirmed weeks found for user');
          }
        } catch (error) {
          console.error('Error getting first unconfirmed week:', error);
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid username or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "There was a problem logging in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKerberosLogin = async () => {
    try {
      setKerberosLoading(true);
      setKerberosError(null);

      // In a real implementation, this would communicate with your Kerberos
      // authentication endpoint on your server
      console.log('Attempting Kerberos SSO authentication');
      
      // Mock implementation for now - in a real scenario this would be replaced 
      // with a call to your Kerberos authentication endpoint
      const response = await fetch('/api/kerberos-auth', {
        method: 'GET',
        credentials: 'include', // Important for Kerberos - sends cookies/auth headers
      });
      
      if (!response.ok) {
        throw new Error('Kerberos authentication failed');
      }
      
      const data = await response.json();
      
      // Process the user data similarly to the standard login flow
      if (data.user) {
        const userRole = data.user.type as 'admin' | 'user' | 'manager';
        
        const appUser: User = {
          id: data.user.id,
          username: data.user.login,
          name: data.user.name,
          role: userRole,
          password: '',  // No password needed for Kerberos auth
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
        
        localStorage.setItem('userSession', JSON.stringify(appUser));
        onLogin(appUser);
        
        toast({
          title: "Kerberos Authentication Successful",
          description: `You are now logged in as ${appUser.name}`
        });
      } else {
        throw new Error('Failed to retrieve user data');
      }
    } catch (error) {
      console.error('Kerberos login error:', error);
      setKerberosError('Kerberos authentication failed. Please ensure you are connected to the domain and your browser is properly configured.');
      toast({
        title: "Kerberos Authentication Failed",
        description: "There was a problem with single sign-on. Please try again or use password authentication.",
        variant: "destructive"
      });
    } finally {
      setKerberosLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600"></p>
        </div>
        
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="kerberos">Kerberos SSO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="password">
            <form className="mt-8 space-y-6" onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <div>
                  <Input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div>
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="kerberos">
            <div className="mt-8 space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  Kerberos single sign-on allows you to authenticate using your domain credentials.
                  Make sure you're connected to the company network or VPN.
                </AlertDescription>
              </Alert>
              
              {kerberosError && (
                <Alert variant="destructive">
                  <AlertDescription>{kerberosError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                className="w-full"
                onClick={handleKerberosLogin}
                disabled={kerberosLoading}
              >
                {kerberosLoading ? "Authenticating..." : "Sign in with Kerberos"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
