
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AddCustomWeekForm } from "@/components/CustomWeeks/AddCustomWeekForm";
import { CustomWeeksTable } from "@/components/CustomWeeks/CustomWeeksTable";
import { useCustomWeeks } from "@/hooks/useCustomWeeks";

const CustomWeeks = () => {
  const { weeks, loading, addWeek } = useCustomWeeks();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  return (
    <div className="container mx-auto p-4 space-y-6 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Custom Weeks Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <AddCustomWeekForm weeks={weeks} onWeekAdded={addWeek} />

      <div className="mt-8">
        <CustomWeeksTable 
          weeks={weeks} 
          loading={loading} 
          selectedYear={selectedYear} 
          setSelectedYear={setSelectedYear} 
        />
      </div>
    </div>
  );
};

export default CustomWeeks;
