
// Import necessary modules and components
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { AppRoutes } from './components/AppRoutes';
import { AppProvider } from './contexts/AppContext';

// Import the supabase client from our client file
import { supabase } from './integrations/supabase/client';

function App() {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AppProvider>
        <Router>
          <div className="container" style={{ padding: '50px 0 100px 0' }}>
            <AppRoutes />
          </div>
        </Router>
      </AppProvider>
    </SessionContextProvider>
  );
}

export default App;
