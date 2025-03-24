
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { YearData } from '@/integrations/supabase/database/years';

interface YearAddFormProps {
  onSubmit: (values: YearData) => Promise<void>;
  isSubmitting: boolean;
}

export function YearAddForm({ onSubmit, isSubmitting }: YearAddFormProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState<YearData>({
    year: new Date().getFullYear().toString(),
    jan: 0,
    feb: 0,
    mar: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'year') {
      setFormState(prev => ({ ...prev, [name]: value }));
    } else {
      // Convert to number for month fields
      const numValue = parseInt(value, 10) || 0;
      setFormState(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formState.year.trim()) {
      toast({
        title: "Error",
        description: "Year is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onSubmit(formState);
      
      // Reset form after successful submission
      setFormState({
        year: new Date().getFullYear().toString(),
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0
      });
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  const months = [
    { name: 'jan', label: 'January' },
    { name: 'feb', label: 'February' },
    { name: 'mar', label: 'March' },
    { name: 'apr', label: 'April' },
    { name: 'may', label: 'May' },
    { name: 'jun', label: 'June' },
    { name: 'jul', label: 'July' },
    { name: 'aug', label: 'August' },
    { name: 'sep', label: 'September' },
    { name: 'oct', label: 'October' },
    { name: 'nov', label: 'November' },
    { name: 'dec', label: 'December' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Input 
          id="year"
          name="year"
          placeholder="e.g. 2024" 
          value={formState.year}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Monthly Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {months.map(month => (
            <div key={month.name} className="space-y-2">
              <Label htmlFor={month.name}>{month.label}</Label>
              <Input 
                id={month.name}
                name={month.name}
                type="number"
                min="0"
                placeholder="0"
                value={formState[month.name as keyof YearData]}
                onChange={handleInputChange}
              />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Year"}
      </Button>
    </form>
  );
}
