
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VersionManagement } from '@/components/Planning/VersionManagement';

const PlanningAdmin = () => {
  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Planning Administration</h1>
        <div className="flex space-x-2">
          <Link to="/planning">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Go to Planning
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <VersionManagement />
      </div>
    </div>
  );
};

export default PlanningAdmin;
