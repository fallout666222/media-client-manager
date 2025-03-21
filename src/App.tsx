
// Import necessary modules and components
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { AppRoutes } from './components/AppRoutes';

function App() {
  const session = useSession();
  const supabase = useSupabaseClient();

  return (
    <Router>
      <div className="container" style={{ padding: '50px 0 100px 0' }}>
        {!session ? (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/account`}
          />
        ) : (
          <AppRoutes />
        )}
      </div>
    </Router>
  );
}

export default App;
