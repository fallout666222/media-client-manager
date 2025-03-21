
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/planning">
          <Button variant="outline" className="w-full">Planning</Button>
        </Link>
        <Link to="/planning-admin">
          <Button variant="outline" className="w-full">Planning Admin</Button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
