
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
        // Sign up with email and password
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          toast({
            title: "Sign Up Error",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data.user) {
          toast({
            title: "Account Created",
            description: "Please check your email to confirm your account"
          });
          
          // Automatically switch to login mode after successful signup
          setIsSignUp(false);
        }
      } else {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          toast({
            title: "Login Error",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data.user) {
          // Get user profile from user_profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            toast({
              title: "Profile Error",
              description: "Could not retrieve your user profile",
              variant: "destructive"
            });
            return;
          }

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
          };

          // Call the onLogin callback with user data
          onLogin(appUser);
          
          toast({
            title: "Welcome back!",
            description: `You are now logged in as ${profileData.name || email}`
          });
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
