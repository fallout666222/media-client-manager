import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/timesheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
  const [adfsLoading, setAdfsLoading] = useState(false);
  const [adfsError, setAdfsError] = useState<string | null>(null);
  const [adfsProtocol, setAdfsProtocol] = useState<"oauth" | "saml">("oauth");

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
        
        localStorage.setItem('userSession', JSON.stringify(appUser));
        
        onLogin(appUser);
        toast({
          title: "Welcome back!",
          description: `You are now logged in as ${data.name}`
        });

        try {
          console.log('Checking for unconfirmed weeks for user:', data.id);
          const firstUnconfirmedWeek = await getUserFirstUnconfirmedWeek(data.id);
          if (firstUnconfirmedWeek) {
            console.log('Found unconfirmed week to redirect to:', firstUnconfirmedWeek);
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

      console.log('Attempting Kerberos SSO authentication');
      
      const response = await fetch('/api/kerberos-auth', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Kerberos authentication failed');
      }
      
      const data = await response.json();
      
      if (data.user) {
        const userRole = data.user.type as 'admin' | 'user' | 'manager';
        
        const appUser: User = {
          id: data.user.id,
          username: data.user.login,
          name: data.user.name,
          role: userRole,
          password: '',
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

  const handleAdfsLogin = async () => {
    try {
      setAdfsLoading(true);
      setAdfsError(null);

      console.log(`Initiating ADFS authentication using ${adfsProtocol} protocol`);
      
      const adfsUrl = import.meta.env.VITE_ADFS_URL || 'https://adfs.example.org/adfs';
      const clientId = import.meta.env.VITE_ADFS_CLIENT_ID || 'your-client-id';
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/adfs-callback');
      
      if (!adfsUrl || adfsUrl === 'https://adfs.example.org/adfs') {
        throw new Error('adfs_not_configured');
      }
      
      if (adfsProtocol === "oauth") {
        const authUrl = `${adfsUrl}/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&resource=https://timesheet.app&scope=openid profile email`;
        
        try {
          const pingResponse = await fetch(`${adfsUrl}/ping`, { 
            method: 'GET',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache'
          });
          
          window.location.href = authUrl;
        } catch (connectionError) {
          console.error('ADFS server connection error:', connectionError);
          throw new Error('adfs_connection_error');
        }
      } else {
        try {
          const response = await fetch(`${window.location.origin}/api/auth/initiate-saml`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              redirectUri: window.location.origin + '/auth/saml-callback'
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to initiate SAML authentication');
          }
          
          const { samlRequest } = await response.json();
          
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = `${adfsUrl}/saml/sso`;
          form.style.display = 'none';
          
          const samlRequestInput = document.createElement('input');
          samlRequestInput.type = 'hidden';
          samlRequestInput.name = 'SAMLRequest';
          samlRequestInput.value = samlRequest;
          form.appendChild(samlRequestInput);
          
          document.body.appendChild(form);
          form.submit();
        } catch (connectionError) {
          console.error('SAML initiation error:', connectionError);
          throw new Error('saml_initiation_error');
        }
      }
      
    } catch (error) {
      console.error('ADFS login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'unknown_error';
      
      switch(errorMessage) {
        case 'adfs_not_configured':
          setAdfsError('ADFS не настроен. Пожалуйста, обратитесь к администратору системы.');
          break;
        case 'adfs_connection_error':
          setAdfsError('Не удалось подключиться к серверу ADFS. Проверьте сетевое подключение и доступность сервера.');
          break;
        case 'saml_initiation_error':
          setAdfsError('Не удалось инициировать аутентификацию SAML. Проверьте настройки ADFS и доступность сервера.');
          break;
        case 'user_not_found':
          setAdfsError(`Пользователь "${username || 'Unknown'}" не найден в системе.`);
          break;
        case 'insufficient_permissions':
          setAdfsError('Недостаточно прав для входа в систему. Обратитесь к администратору.');
          break;
        default:
          setAdfsError('Произошла неизвестная ошибка при авторизации через ADFS. Пожалуйста, попробуйте позже или используйте другой метод входа.');
      }
      
      toast({
        title: "Ошибка ADFS аутентификации",
        description: "Возникла проблема с единым входом. Пожалуйста, попробуйте еще раз или используйте другой метод входа.",
        variant: "destructive"
      });
    } finally {
      setAdfsLoading(false);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="kerberos">Kerberos SSO</TabsTrigger>
            <TabsTrigger value="adfs">ADFS SSO</TabsTrigger>
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
          
          <TabsContent value="adfs">
            <div className="mt-8 space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  ADFS single sign-on allows you to authenticate using your organization's
                  Active Directory Federation Services. You will be redirected to your
                  organization's login page.
                </AlertDescription>
              </Alert>
              
              <RadioGroup 
                className="mb-4" 
                defaultValue="oauth" 
                value={adfsProtocol} 
                onValueChange={(value) => setAdfsProtocol(value as "oauth" | "saml")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oauth" id="oauth" />
                  <Label htmlFor="oauth">OAuth 2.0</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saml" id="saml" />
                  <Label htmlFor="saml">SAML 2.0</Label>
                </div>
              </RadioGroup>
              
              {adfsError && (
                <Alert variant="destructive">
                  <AlertDescription>{adfsError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                className="w-full"
                onClick={handleAdfsLogin}
                disabled={adfsLoading}
              >
                {adfsLoading ? "Redirecting..." : `Sign in with ADFS (${adfsProtocol.toUpperCase()})`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
