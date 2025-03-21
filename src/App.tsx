// Import necessary modules and components
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import Account from './pages/Account';
import Home from './pages/Home';
import Clients from './pages/Clients';
import Users from './pages/Users';
import Departments from './pages/Departments';
import MediaTypes from './pages/MediaTypes';
import Weeks from './pages/Weeks';
import Timesheet from './pages/Timesheet';
import Planning from './pages/Planning';
// Import the new PlanningAdmin page
import PlanningAdmin from "./pages/PlanningAdmin";

function App() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!session);
  }, [session]);

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
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/account" element={<Account session={session} />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/users" element={<Users />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/media-types" element={<MediaTypes />} />
            <Route path="/weeks" element={<Weeks />} />
            <Route path="/timesheet" element={<Timesheet />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/planning-admin" element={<PlanningAdmin />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
