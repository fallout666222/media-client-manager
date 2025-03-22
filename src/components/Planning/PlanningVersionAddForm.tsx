
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PlanningVersionAddFormProps {
  onSubmit: (values: {
    name: string;
    year: string;
    q1_locked: boolean;
    q2_locked: boolean;
    q3_locked: boolean;
    q4_locked: boolean;
  }) => Promise<void>;
  availableYears: string[];
  isSubmitting: boolean;
}

export function PlanningVersionAddForm({
  onSubmit,
  availableYears,
  isSubmitting
}: PlanningVersionAddFormProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: "",
    year: "",
    q1_locked: false,
    q2_locked: false,
    q3_locked: false,
    q4_locked: false
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleYearChange = (value: string) => {
    setFormState(prev => ({ ...prev, year: value }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formState.name.trim()) {
      toast({
        title: "Error",
        description: "Version name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formState.year) {
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
        name: "",
        year: "",
        q1_locked: false,
        q2_locked: false,
        q3_locked: false,
        q4_locked: false
      });
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Version Name</Label>
        <Input 
          id="name"
          name="name"
          placeholder="e.g. Plan 2024 v1" 
          value={formState.name}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Select 
          value={formState.year}
          onValueChange={handleYearChange}
        >
          <SelectTrigger id="year">
            <SelectValue placeholder="Select a year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="q1_locked"
            checked={formState.q1_locked}
            onCheckedChange={(checked) => handleCheckboxChange('q1_locked', checked === true)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="q1_locked">Lock Q1</Label>
          </div>
        </div>
        
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="q2_locked"
            checked={formState.q2_locked}
            onCheckedChange={(checked) => handleCheckboxChange('q2_locked', checked === true)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="q2_locked">Lock Q2</Label>
          </div>
        </div>
        
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="q3_locked"
            checked={formState.q3_locked}
            onCheckedChange={(checked) => handleCheckboxChange('q3_locked', checked === true)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="q3_locked">Lock Q3</Label>
          </div>
        </div>
        
        <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id="q4_locked"
            checked={formState.q4_locked}
            onCheckedChange={(checked) => handleCheckboxChange('q4_locked', checked === true)}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="q4_locked">Lock Q4</Label>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Version"}
      </Button>
    </form>
  );
}
