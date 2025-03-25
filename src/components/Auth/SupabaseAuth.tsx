
import { useState } from "react";
import { User } from "@/types/timesheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SupabaseAuthProps {
  onLogin: (user: User) => void;
}

export const SupabaseAuth = ({ onLogin }: SupabaseAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleEmailAuth = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        console.log('Attempting to sign up with email:', email);
        // Sign up with email and password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('Sign up error:', error);
          setErrorMessage(error.message);
          toast({
            title: "Sign Up Error",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        console.log('Sign up response:', data);
        
        if (data.user) {
          toast({
            title: "Account Created",
            description: "Please check your email to confirm your account"
          });
          
          // Automatically switch to login mode after successful signup
          setIsSignUp(false);
        }
      } else {
        console.log('Attempting to sign in with email:', email);
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error);
          setErrorMessage(error.message);
          toast({
            title: "Login Error",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        console.log('Sign in response:', data);
        
        if (data.user) {
          try {
            // Get user profile from user_profiles table
            console.log('Fetching user profile for ID:', data.user.id);
            let { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile:', profileError);
              
              // Wait a moment and retry once
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const { data: retryData, error: retryError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
              if (retryError) {
                console.error('Error on retry fetching user profile:', retryError);
                toast({
                  title: "Profile Error",
                  description: "Could not retrieve your user profile",
                  variant: "destructive"
                });
                return;
              }
              
              profileData = retryData;
            }

            if (!profileData) {
              console.error('No profile data found');
              toast({
                title: "Profile Error",
                description: "User profile not found",
                variant: "destructive"
              });
              return;
            }
            
            console.log('Profile data retrieved:', profileData);

            // Create a properly formatted User object
            const appUser: User = {
              id: data.user.id,
              username: profileData.login,
              name: profileData.name,
              role: profileData.type as 'admin' | 'user' | 'manager',
              email: data.user.email,
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
              user_head_id: profileData.user_head_id,
              dark_theme: profileData.dark_theme,
              language: profileData.language,
              deletion_mark: false,
              hidden: profileData.hidden
            };

            console.log('App user object created:', appUser);
            
            // Save to localStorage
            localStorage.setItem('userSession', JSON.stringify(appUser));
            
            // Call the onLogin callback with user data
            onLogin(appUser);
            
            toast({
              title: "Welcome back!",
              description: `You are now logged in as ${profileData.name || email}`
            });
          } catch (err) {
            console.error('Error processing user data:', err);
            toast({
              title: "Login Error",
              description: "Error processing user data after authentication",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Supabase auth error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for a password reset link"
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          {isSignUp 
            ? "Create a new account using your email and password" 
            : "Sign in with your email and password"
          }
        </AlertDescription>
      </Alert>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleEmailAuth}>
        <div>
          <Input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <Input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <div className="flex items-center justify-between">
          {!isSignUp && (
            <button 
              type="button" 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={resetPassword}
            >
              Forgot password?
            </button>
          )}
          <button 
            type="button" 
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading 
            ? isSignUp ? "Creating account..." : "Signing in..." 
            : isSignUp ? "Create Account" : "Sign in"
          }
        </Button>
      </form>
    </div>
  );
};
