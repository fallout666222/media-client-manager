import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const Index = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      // If user is logged in, keep them on the main page
      // The App component will render the proper content
    } else {
      // If no user is logged in, redirect to login page
      navigate('/login');
    }
  }, [user, navigate]);

  // Show a loading or welcome screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-xl p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Welcome to Timesheet App</h1>
        <p className="text-xl text-gray-600 mb-6">Manage your time efficiently</p>
        {!user && (
          <p className="text-gray-500">Redirecting to login page...</p>
        )}
      </div>
    </div>
  );
};

export default Index;
